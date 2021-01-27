import { Request, Response, NextFunction } from 'express';
import Joi from '@hapi/joi';

import GovDeliveryService, { DefaultSupportEmail, PublishingSupportEmail } from '../services/GovDeliveryService';

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

type DefaultSupportRequest = {
  type: SubmissionType.DEFAULT;
  description: string;
  apis?: string[];
} & ContactDetails

type PublishingSupportRequest = {
  type: SubmissionType.PUBLISHING;
  apiDetails: string;
  apiDescription?: string;
  apiInternalOnly: boolean;
  apiOtherInfo?: string;
} & ContactDetails

type SupportRequest = DefaultSupportRequest | PublishingSupportRequest

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
    apiDescription: Joi.string().optional(),
    apiInternalOnly: Joi.boolean().required(),
    apiOtherInfo: Joi.string().optional(),
    description: Joi.forbidden(),
    apis: Joi.forbidden(),
  }),
}).options({ abortEarly: false });

export default function contactUsHandler(govDelivery: GovDeliveryService) {
  return async function (req: Request<{}, {}, SupportRequest>, res: Response, next: NextFunction): Promise<void> {
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
          apiOtherInfo: req.body.apiOtherInfo,
        };
        
        await govDelivery.sendPublishingSupportEmail(supportRequest);
        res.sendStatus(200);
      } else {
        const supportRequest: DefaultSupportEmail = {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          requester: req.body.email,
          description: req.body.description,
          organization: req.body.organization,
          apis: req.body.apis,
        };
        
        await govDelivery.sendDefaultSupportEmail(supportRequest);
        res.sendStatus(200);
      }
    } catch(err) {
      err.action = 'sending contact us email';
      next(err);
    }
  };
}
