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
import githubSecurityHandler, { secretScanningAlertSchema } from './Github';
import healthCheckHandler from './HealthCheck';
import signupsReportHandler, { signupsReportSchema } from './management/SignupsReport';
import versionHandler from './Version';
import cors from 'cors';

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

  publicRoutes.post('/github',
    validationMiddleware(secretScanningAlertSchema,'body'),
    githubSecurityHandler(govDelivery,slack));

  publicRoutes.get('/health_check', healthCheckHandler(kong, okta, dynamo, govDelivery, slack));

  // This simple ping endpoint is for use with a Pingdom check
  publicRoutes.get('/ping', (_req, res) => {
    res.send('pong');
  });
  app.use(`${GATEWAY_PATH_PREFIX}/public`, publicRoutes);

  publicRoutes.get('/version', versionHandler());

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
