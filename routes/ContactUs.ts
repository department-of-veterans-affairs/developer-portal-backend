import { Request, Response, NextFunction } from 'express';
import Joi from '@hapi/joi';

import GovDeliveryService, { ConsumerSupportEmail, PublishingSupportEmail, ProductionAccessSupportEmail} from '../services/GovDeliveryService';
import { DevPortalError } from '../models/DevPortalError';

export const enum SubmissionType {
  DEFAULT = 'DEFAULT',
  PUBLISHING = 'PUBLISHING',
  PRODUCTION_ACCESS = 'PRODUCTION_ACCESS',
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
} & ContactDetails

export type PublishingSupportRequest = {
  type: SubmissionType.PUBLISHING;
  apiDetails: string;
  apiDescription?: string;
  apiInternalOnly: boolean;
  apiInternalOnlyDetails?: string;
  apiOtherInfo?: string;
} & ContactDetails

type SupportRequest = ConsumerSupportRequest | PublishingSupportRequest

export const contactSchema = Joi.object().keys({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  description: Joi.string().required(),
  organization: Joi.string().allow(''),
  apis: Joi.array().items(Joi.string()),
  type: Joi.string().valid(SubmissionType.DEFAULT, SubmissionType.PUBLISHING).optional(),
}).when(Joi.object({type: Joi.valid(SubmissionType.PUBLISHING).required()}).unknown(), {
  then: Joi.object({
    apiDetails: Joi.string().required(),
    apiDescription: Joi.string().allow(''),
    apiInternalOnly: Joi.boolean().required(),
    apiInternalOnlyDetails: Joi.string().forbidden().when('apiInternalOnly', {
      is: Joi.boolean().required().valid(true),
      then: Joi.required(),
    }),
    apiOtherInfo: Joi.string().allow(''),
    description: Joi.forbidden(),
    apis: Joi.forbidden(),
  }),
}).options({ abortEarly: false });

export default function contactUsHandler(govDelivery: GovDeliveryService) {
  return async function (req: Request<Record<string, unknown>, Record<string, unknown>, SupportRequest>, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.body.type === SubmissionType.PUBLISHING) {
        const supportRequest: PublishingSupportEmail = {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          requester: req.body.email,
          organization: req.body.organization,
          apiDetails: req.body.apiDetails,
          apiDescription: req.body.apiDescription,
          apiInternalOnly: req.body.apiInternalOnly,
          apiInternalOnlyDetails: req.body.apiInternalOnlyDetails,
          apiOtherInfo: req.body.apiOtherInfo,
        };

        await govDelivery.sendPublishingSupportEmail(supportRequest);
        res.sendStatus(200);
      } else {
        const supportRequest: ConsumerSupportEmail = {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          requester: req.body.email,
          description: req.body.description,
          organization: req.body.organization,
          apis: req.body.apis,
        };

        await govDelivery.sendConsumerSupportEmail(supportRequest);
        res.sendStatus(200);
      }
    } catch(err: unknown) {
      (err as DevPortalError).action = 'sending contact us email';
      next(err);
    }
  };
}
