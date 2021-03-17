import { Schema, ValidationErrorItem } from '@hapi/joi';
import express, { Express, Request, Response, NextFunction } from 'express';
import DynamoService from '../services/DynamoService';
import GovDeliveryService from '../services/GovDeliveryService';
import KongService from '../services/KongService';
import OktaService from '../services/OktaService';
import SignupMetricsService from '../services/SignupMetricsService';
import SlackService from '../services/SlackService';
import VersionService from '../services/VersionService';
import developerApplicationHandler, { applySchema } from './DeveloperApplication';
import contactUsHandler, { contactSchema } from './ContactUs';
import healthCheckHandler from './HealthCheck';
import signupsReportHandler, { signupsReportSchema } from './management/SignupsReport';
import cors from 'cors';
import versionHandler from './Version';

function validationMiddleware(schema: Schema, toValidate: string) {
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
  version: VersionService;
}

/**
 * The rev proxy only sends paths prefixed with either /services or /internal to Kong. All
 * developer portal routes start with /internal/developer-portal, and since we do not strip the
 * matched path at the gateway, all routes in this app must begin with this prefix.
 * 
 * see https://github.com/department-of-veterans-affairs/devops/blob/master/ansible/deployment/config/revproxy-vagov/templates/nginx_api_server.conf.j2#L171-L229
 */
const GATEWAY_PATH_PREFIX = '/internal/developer-portal';
const configureRoutes = (app: Express, services: AppServices): void => {
  const {
    kong,
    okta,
    dynamo,
    govDelivery,
    signups,
    slack,
    version,
  } = services;

  /**
   * LOCAL DEV
   */
  if(process.env.DEVELOPER_PORTAL_URL) {
    const options: cors.CorsOptions = {
      origin: process.env.DEVELOPER_PORTAL_URL,
    };  
    app.use(cors(options));
  }

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
  
  publicRoutes.get('/version', versionHandler(version));

  app.use(`${GATEWAY_PATH_PREFIX}/public`, publicRoutes);

  /**
   * PROTECTED
   */
  const adminRoutes = express.Router();
  adminRoutes.get('/reports/signups',
    validationMiddleware(signupsReportSchema, 'query'),
    signupsReportHandler(signups, slack));
  app.use(`${GATEWAY_PATH_PREFIX}/admin`, adminRoutes);
};

export default configureRoutes;
