import express, { Request, Response, NextFunction } from 'express';
import { config, DynamoDB } from 'aws-sdk';
import morgan from 'morgan';
import { Schema, ValidationErrorItem } from '@hapi/joi';

import logger from './config/logger';
import Sentry from './config/Sentry';
import OktaService from './services/OktaService';
import KongService from './services/KongService';
import GovDeliveryService from './services/GovDeliveryService';
import { KongConfig } from './types';
import SlackService from './services/SlackService';
import developerApplicationHandler, { applySchema } from './routes/DeveloperApplication';
import contactUsHandler from './routes/ContactUs';
import healthCheckHandler from './routes/HealthCheck';

function validationMiddleware(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    if (error) {
      const messages = error.details.map((i: ValidationErrorItem) => i.message);
      res.status(422).json({ errors:  messages });
    } else {
      next();
    }
  };
}

function loggingMiddleware(tokens, req, res): string {
  return JSON.stringify({
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    contentLength: tokens.res(req, res, 'content-length'), 
    responseTime: `${tokens['response-time'](req, res)} ms`,
  });
}

const configureGovDeliveryService = (): GovDeliveryService | undefined => {
  const { GOVDELIVERY_KEY, GOVDELIVERY_HOST, SUPPORT_EMAIL } = process.env;
  let client;

  if (GOVDELIVERY_KEY && GOVDELIVERY_HOST) {
    client = new GovDeliveryService({
      host: GOVDELIVERY_HOST,
      token: GOVDELIVERY_KEY,
      supportEmailRecipient: SUPPORT_EMAIL || 'api@va.gov',
    });
  }

  return client;
};

const configureKongService = (): KongService => {
  const { KONG_KEY, KONG_HOST, KONG_PROTOCOL, KONG_PORT } = process.env;

  if (KONG_KEY && KONG_HOST) {
    // String interpolation here ensures the first arg to parseInt is
    // always a string and never undefined.
    const port = parseInt(`${KONG_PORT}`, 10) || 8000;

    const kongfig: KongConfig = {
      apiKey: KONG_KEY,
      host: KONG_HOST,
      port: port,
    };
    if (KONG_PROTOCOL === 'http' || KONG_PROTOCOL === 'https') {
      kongfig.protocol = KONG_PROTOCOL;
    }
    return new KongService(kongfig);
  } else {
    throw new Error('Kong Config Missing');
  }
};

const configureOktaService = (): OktaService | undefined => {
  const { OKTA_TOKEN, OKTA_ORG } = process.env;
  let client;

  if (OKTA_TOKEN && OKTA_ORG) {
    client = new OktaService({
      org: OKTA_ORG,
      token: OKTA_TOKEN,
    });
  }

  return client;
};

const configureSlackService = (): SlackService | undefined => {
  const { SLACK_WEBHOOK, SLACK_CHANNEL } = process.env;
  let client;

  if (SLACK_WEBHOOK && SLACK_CHANNEL) {
    client = new SlackService(SLACK_WEBHOOK, {
      channel: SLACK_CHANNEL,
      username: 'Developer Portal',
      icon_emoji: ':lighthouse:',
    });
  }

  return client;
};

interface HttpOptions {
  timeout: number;
}

interface DynamoConfig {
  httpOptions: HttpOptions;
  maxRetries: number;
  endpoint?: string | undefined;
}

const configureDynamoDBClient = (): DynamoDB.DocumentClient => {
  const dynamoConfig: DynamoConfig = {
    httpOptions: {
      timeout: 5000,
    },
    maxRetries: 1,
  };
  if (process.env.NODE_ENV !== 'production') {
    config.update({
      accessKeyId: 'NONE',
      region: 'us-west-2',
      secretAccessKey: 'NONE',
    });
    dynamoConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
  }

  return new DynamoDB.DocumentClient(dynamoConfig);
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
  const dynamo = configureDynamoDBClient();
  const govdelivery = configureGovDeliveryService();
  const slack = configureSlackService();

  app.post('/developer_application', 
    validationMiddleware(applySchema), 
    developerApplicationHandler(kong, okta, dynamo, govdelivery, slack));

  app.post('/contact-us', contactUsHandler(govdelivery));

  app.get('/health_check', healthCheckHandler(kong, okta, dynamo, govdelivery, slack));

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
          stack: err.stack 
        });
      }
    }
  });

  return app;
}
