import express from 'express';
import { config } from 'aws-sdk';
import morgan from 'morgan';

import logger from './config/logger';
import Sentry from './config/Sentry';
import OktaService from './services/OktaService';
import KongService from './services/KongService';
import GovDeliveryService from './services/GovDeliveryService';
import { DynamoConfig, KongConfig } from './types';
import SlackService from './services/SlackService';
import DynamoService from './services/DynamoService';
import SignupMetricsService from './services/SignupMetricsService';
import configureRoutes, { validationMiddleware } from './routes';
import developerApplicationHandler, { applySchema } from './routes/DeveloperApplication';
import contactUsHandler, { contactSchema } from './routes/ContactUs';
import healthCheckHandler from './routes/HealthCheck';
import signupsReportHandler, { signupsReportSchema } from './routes/management/SignupsReport';

function loggingMiddleware(tokens, req, res): string {
  return JSON.stringify({
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    contentLength: tokens.res(req, res, 'content-length'),
    responseTime: `${tokens['response-time'](req, res)} ms`,
  });
}

const configureGovDeliveryService = (): GovDeliveryService => {
  const { GOVDELIVERY_KEY, GOVDELIVERY_HOST, SUPPORT_EMAIL } = process.env;

  if (!GOVDELIVERY_KEY || !GOVDELIVERY_HOST) {
    throw new Error('GovDelivery Config Missing');
  }

  return new GovDeliveryService({
    host: GOVDELIVERY_HOST,
    token: GOVDELIVERY_KEY,
    supportEmailRecipient: SUPPORT_EMAIL || 'api@va.gov',
  });
};

const configureKongService = (): KongService => {
  const { KONG_KEY, KONG_HOST, KONG_PROTOCOL, KONG_PORT } = process.env;

  if (!KONG_KEY || !KONG_HOST) {
    throw new Error('Kong Config Missing');
  }

  // String interpolation here ensures the first arg to parseInt is
  // always a string and never undefined.
  const port = parseInt(`${KONG_PORT}`, 10) || 8000;

  const kongConfig: KongConfig = {
    apiKey: KONG_KEY,
    host: KONG_HOST,
    port: port,
  };
  if (KONG_PROTOCOL === 'http' || KONG_PROTOCOL === 'https') {
    kongConfig.protocol = KONG_PROTOCOL;
  }
  return new KongService(kongConfig);
};

const configureOktaService = (): OktaService => {
  const { OKTA_TOKEN, OKTA_ORG, OKTA_HOST } = process.env;

  if (!OKTA_TOKEN || !(OKTA_ORG || OKTA_HOST)) {
    throw new Error('Okta Config Missing');
  }

  return new OktaService({
    host: OKTA_HOST || `https://${OKTA_ORG}.okta.com`,
    token: OKTA_TOKEN,
  });
};

const configureSlackService = (): SlackService => {
  const { SLACK_BASE_URL, SLACK_TOKEN, SLACK_CHANNEL, SLACK_BOT_ID } = process.env;

  if(!SLACK_BASE_URL || !SLACK_TOKEN || !SLACK_CHANNEL || !SLACK_BOT_ID){
    throw new Error('Slack Config Missing');
  }

  return new SlackService(SLACK_BASE_URL, SLACK_TOKEN, {
    channel: SLACK_CHANNEL,
    bot: SLACK_BOT_ID,
  });
};

const configureDynamoService = (): DynamoService => {
  const dynamoConfig: DynamoConfig = {
    httpOptions: {
      timeout: 5000,
    },
    maxRetries: 1,
  };

  // To run against a local containerized DynamoDB, make sure to have
  // DYNAMODB_ENDPOINT set.
  // To run against a remote DynamoDB table, create an MFA session, transfer
  // the creds to the following ENV vars, and remove DYNAMODB_ENDPOINT.
  if (process.env.NODE_ENV !== 'production') {
    config.update({
      accessKeyId: process.env.DYNAMO_ACCESS_KEY_ID || 'NONE',
      region: process.env.DYNAMO_REGION || 'us-west-2',
      secretAccessKey: process.env.DYNAMO_ACCESS_KEY_SECRET || 'NONE',
      sessionToken: process.env.DYNAMO_SESSION_TOKEN,
    });
    if (process.env.DYNAMODB_ENDPOINT) {
      dynamoConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
    }
  }
  return new DynamoService(dynamoConfig);
};

export default function configureApp(): express.Application {
  const app = express();

  // Must be the first middleware
  app.use(Sentry.Handlers.requestHandler());

  // request logs are skipped for the health check endpoint and in tests
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(loggingMiddleware, { skip: req => req.url === '/health' }));
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.get('/', (req, res) => {
    res.send('developer-portal-backend');
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'up' });
  });

  const kong = configureKongService();
  const okta = configureOktaService();
  const dynamo = configureDynamoService();
  const govDelivery = configureGovDeliveryService();
  const slack = configureSlackService();
  const signups = new SignupMetricsService(dynamo);

  // NEW ROUTES
  configureRoutes(app, {
    dynamo,
    govDelivery,
    kong,
    okta,
    signups,
    slack,
  });

  // OLD ROUTES
  app.post('/developer_application',
    validationMiddleware(applySchema, 'body'),
    developerApplicationHandler(kong, okta, dynamo, govDelivery, slack));

  app.post('/contact-us',
    validationMiddleware(contactSchema, 'body'),
    contactUsHandler(govDelivery));

  app.get('/health_check', healthCheckHandler(kong, okta, dynamo, govDelivery, slack));

  app.get('/reports/signups',
    validationMiddleware(signupsReportSchema, 'query'),
    signupsReportHandler(signups, slack));

  app.use(Sentry.Handlers.errorHandler());

  /* 
   * 'next' is a required param despite not being used. Typescript will throw
   * a compilation error on `res.status` if only three params are listed, because Express
   * types it as a regular middleware function instead of an error-handling
   * middleware function if three parameters are provided instead of four.
   */
  app.use((err, req, res, next) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    // To prevent sensitive information from ending up in the logs like keys, only certain safe
    // fields are logged from errors.
    logger.error({ message: err.message, action: err.action, stack: err.stack });


    // Because we hooking post-response processing into the global error handler, we
    // get to leverage unified logging and error handling; but, it means the response
    // may have already been committed, since we don't know if the error was thrown
    // PRE or POST response. As such, we have to check to see if the response has
    // been committed before we attempt to send anything to the user.
    if (!res.headersSent) {
      if (process.env.NODE_ENV === 'production') {
        res.status(500).json({ error: 'encountered an error' });
      } else {
        res.status(500).json({
          action: err.action,
          message: err.message,
          stack: err.stack,
        });
      }
    }
  });

  return app;
}
