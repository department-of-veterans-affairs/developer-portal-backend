import { Request, Response, NextFunction } from 'express';
import Joi from '@hapi/joi';

import GovDeliveryService, {
  ConsumerSupportEmail,
  PublishingSupportEmail,
} from '../services/GovDeliveryService';
import { DevPortalError } from '../models/DevPortalError';

export const enum SubmissionType {
  DEFAULT = 'DEFAULT',
  PUBLISHING = 'PUBLISHING',
}

interface ContactDetails {
  firstName: string;
  lastName: string;
  email: string;
  organization?: string;
}

export type ConsumerSupportRequest = {
  type: SubmissionType.DEFAULT;
  description: string;
  apis?: string[];
} & ContactDetails;

export type PublishingSupportRequest = {
  type: SubmissionType.PUBLISHING;
  apiDetails: string;
  apiDescription?: string;
  apiInternalOnly: boolean;
  apiInternalOnlyDetails?: string;
  apiOtherInfo?: string;
} & ContactDetails;

type SupportRequest = ConsumerSupportRequest | PublishingSupportRequest;

export const contactSchema = Joi.object()
  .keys({
    apis: Joi.array().items(Joi.string()),
    description: Joi.string().required(),
    email: Joi.string().email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    organization: Joi.string().allow(''),
    type: Joi.string().valid(SubmissionType.DEFAULT, SubmissionType.PUBLISHING).optional(),
  })
  .when(Joi.object({ type: Joi.valid(SubmissionType.PUBLISHING).required() }).unknown(), {
    then: Joi.object({
      apiDescription: Joi.string().allow(''),
      apiDetails: Joi.string().required(),
      apiInternalOnly: Joi.boolean().required(),
      apiInternalOnlyDetails: Joi.string()
        .forbidden()
        .when('apiInternalOnly', {
          is: Joi.boolean().required().valid(true),
          then: Joi.required(),
        }),
      apiOtherInfo: Joi.string().allow(''),
      apis: Joi.forbidden(),
      description: Joi.forbidden(),
    }),
  })
  .options({ abortEarly: false });

const contactUsHandler =
  (govDelivery: GovDeliveryService) =>
  async (
    req: Request<Record<string, unknown>, Record<string, unknown>, SupportRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (req.body.type === SubmissionType.PUBLISHING) {
        const supportRequest: PublishingSupportEmail = {
          apiDescription: req.body.apiDescription,
          apiDetails: req.body.apiDetails,
          apiInternalOnly: req.body.apiInternalOnly,
          apiInternalOnlyDetails: req.body.apiInternalOnlyDetails,
          apiOtherInfo: req.body.apiOtherInfo,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          organization: req.body.organization,
          requester: req.body.email,
        };

        await govDelivery.sendPublishingSupportEmail(supportRequest);
        res.sendStatus(200);
      } else {
        const supportRequest: ConsumerSupportEmail = {
          apis: req.body.apis,
          description: req.body.description,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          organization: req.body.organization,
          requester: req.body.email,
        };

        await govDelivery.sendConsumerSupportEmail(supportRequest);
        res.sendStatus(200);
      }
    } catch (err: unknown) {
      (err as DevPortalError).action = 'sending contact us email';
      next(err);
    }
  };

export default contactUsHandler;
