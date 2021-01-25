import { Request, Response, NextFunction } from 'express';
import Joi from '@hapi/joi';

import GovDeliveryService, { DefaultSupportEmail, PublishingSupportEmail } from '../services/GovDeliveryService';

// setting these 'as const' forces the type of the variable to be the explicit string value, instead of just 'string'
// setting the type to the explicit string allows it to be used in the support request types below
const DEFAULT = 'DEFAULT' as const;
const PUBLISHING = 'PUBLISHING' as const;

interface ContactDetails {
  firstName: string;
  lastName: string;
  email: string;
  organization?: string;
}

type DefaultSupportRequest = {
  type: typeof DEFAULT;
  description: string;
  apis?: string[];
} & ContactDetails

type PublishingSupportRequest = {
  type: typeof PUBLISHING;
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
  type: Joi.string().valid(DEFAULT, PUBLISHING).optional(),
}).when(Joi.object({type: Joi.valid(PUBLISHING).required()}).unknown(), {
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
      if (req.body.type === PUBLISHING) {
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
