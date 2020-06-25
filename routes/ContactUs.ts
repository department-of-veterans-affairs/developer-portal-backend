import { Request, Response, NextFunction } from 'express';
import Joi from '@hapi/joi';

import GovDeliveryService, { SupportEmail } from '../services/GovDeliveryService';

export const contactSchema = Joi.object().keys({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  description: Joi.string().required(),
  organization: Joi.string(),
  apis: Joi.array().items(Joi.string()),
}).options({ abortEarly: false });

export default function contactUsHandler(govDelivery: GovDeliveryService | undefined) {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!govDelivery) {
      res.status(503).json({ error: 'service not enabled'});
      return;
    }

    try {
      const supportRequest: SupportEmail = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        requester: req.body.email,
        description: req.body.description,
        organization: req.body.organization,
        apis: req.body.apis,
      };
      
      await govDelivery.sendSupportEmail(supportRequest);
      res.sendStatus(200);
    } catch(err) {
      err.action = 'sending contact us email';
      next(err);
    }
  };
}
