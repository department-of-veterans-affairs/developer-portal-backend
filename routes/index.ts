import { Schema, ValidationErrorItem } from '@hapi/joi';
import express, { Express, Request, Response, NextFunction } from 'express';
import DynamoService from '../services/DynamoService';
import GovDeliveryService from '../services/GovDeliveryService';
import KongService from '../services/KongService';
import OktaService from '../services/OktaService';
import SignupMetricsService from '../services/SignupMetricsService';
import SlackService from '../services/SlackService';
import developerApplicationHandler, { applySchema } from './DeveloperApplication';
import contactUsHandler, { contactSchema } from './ContactUs';
import healthCheckHandler from './HealthCheck';
import signupsReportHandler, { signupsReportSchema } from './management/SignupsReport';

export function validationMiddleware(schema: Schema, toValidate: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req[toValidate]);
    if (error) {
      const messages = error.details.map((i: ValidationErrorItem) => i.message);
      res.status(400).json({ errors: messages });
    } else {
      next();
    }
  };
}

interface AppServices {
  kong: KongService;
  okta: OktaService;
  dynamo: DynamoService;
  govDelivery: GovDeliveryService;
  slack: SlackService;
  signups: SignupMetricsService;
}

const configureRoutes = (app: Express, services: AppServices): void => {
  const {
    kong,
    okta,
    dynamo,
    govDelivery,
    signups,
    slack,
  } = services;

  /**
   * PUBLIC
   */
  const publicRoutes = express.Router();
  publicRoutes.post('/developer_application',
    validationMiddleware(applySchema, 'body'),
    developerApplicationHandler(kong, okta, dynamo, govDelivery, slack));
  
  publicRoutes.post('/contact-us',
    validationMiddleware(contactSchema, 'body'),
    contactUsHandler(govDelivery));
  
  publicRoutes.get('/health_check', healthCheckHandler(kong, okta, dynamo, govDelivery, slack));
  app.use('/public', publicRoutes);

  /**
   * PROTECTED
   */
  const adminRoutes = express.Router();
  adminRoutes.get('/reports/signups',
    validationMiddleware(signupsReportSchema, 'query'),
    signupsReportHandler(signups, slack));
  app.use('/admin', adminRoutes);
};

export default configureRoutes;
