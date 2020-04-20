import express from 'express'
import { config, DynamoDB } from 'aws-sdk'
import morgan from 'morgan'
import * as Sentry from '@sentry/node'
import logger from './lib/config/logger'

import {
  GovDeliveryClient,
  KongClient,
  KongConfig,
  OktaClient,
  SlackClient,
} from './lib'

import developerApplicationHandler from './routes/DeveloperApplication'

function loggingMiddleware(tokens, req, res) {
  return JSON.stringify({
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    contentLength: tokens.res(req, res, 'content-length'), 
    responseTime: `${tokens['response-time'](req, res)} ms`,
  })
}

const configureGovDeliveryClient = (): GovDeliveryClient | null => {
  const { GOVDELIVERY_KEY, GOVDELIVERY_HOST } = process.env
  let client

  if (GOVDELIVERY_KEY && GOVDELIVERY_HOST) {
    client = new GovDeliveryClient({
      host: GOVDELIVERY_HOST,
      token: GOVDELIVERY_KEY,
    })
  }

  return client
}

const configureKongClient = (): KongClient => {
  const { KONG_KEY, KONG_HOST, KONG_PROTOCOL } = process.env

  if (KONG_KEY && KONG_HOST) {
    const kongfig: KongConfig = {
      apiKey: KONG_KEY,
      host: KONG_HOST,
    }
    if (KONG_PROTOCOL === 'http' || KONG_PROTOCOL === 'https') {
      kongfig.protocol = KONG_PROTOCOL
    }
    return new KongClient(kongfig)
  } else {
    throw new Error('Kong Config Missing')
  }
}

const configureOktaClient = (): OktaClient | null => {
  const { OKTA_TOKEN, OKTA_ORG } = process.env
  let client

  if (OKTA_TOKEN && OKTA_ORG) {
    client = new OktaClient({
      org: OKTA_ORG,
      token: OKTA_TOKEN,
    })
  }

  return client
}

const configureSlackClient = (): SlackClient | null => {
  const { SLACK_TOKEN, SLACK_CHANNEL_ID } = process.env
  let client

  if (SLACK_TOKEN && SLACK_CHANNEL_ID) {
    client = new SlackClient({
      channelID: SLACK_CHANNEL_ID,
      token: SLACK_TOKEN,
    })
  }

  return client
}

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
  }
  if (process.env.NODE_ENV !== 'production') {
    config.update({
      accessKeyId: 'NONE',
      region: 'us-west-2',
      secretAccessKey: 'NONE',
    })
    dynamoConfig.endpoint = process.env.DYNAMODB_ENDPOINT
  }

  return new DynamoDB.DocumentClient(dynamoConfig)
}

export default function configureApp(): express.Application {
  const app = express()

  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
    })

    // Must be the first middleware
    app.use(Sentry.Handlers.requestHandler())
  }

  app.use(morgan(loggingMiddleware))
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))

  app.get('/', (req, res) => {
    res.send('hello')
  })

  const kong = configureKongClient()
  const okta = configureOktaClient()
  const dynamo = configureDynamoDBClient()
  const govdelivery = configureGovDeliveryClient()
  const slack = configureSlackClient()

  app.post(
    '/developer_application',
    developerApplicationHandler(kong, okta, dynamo, govdelivery, slack)
  )

  if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler())
  }

  /* 
   * next is a required param despite not being used. typescript will throw
   * a compilation error if only three arguments are provided, because express
   * treats this like a regular middleware function instead of an error-handling
   * middleware function if three parameters are provided instead of four.
   */
  app.use((err, req, res, next) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    // To prevent sensitive information from ending up in the logs like keys, only certain safe
    // fields are logged from errors.
    logger.error({ message: err.message, action: err.action, stack: err.stack })

    if (process.env.NODE_ENV === 'production') {
      res.status(500).json({ error: 'encountered an error' })
    } else {
      res.status(500).json({ 
        action: err.action,
        message: err.message,
        stack: err.stack 
      })
    }
  })

  return app
}
