import express from 'express'
import { config, DynamoDB } from 'aws-sdk'

import {
  GovDeliveryClient,
  KongClient,
  KongConfig,
  OktaClient,
  SlackClient,
} from './lib'

import developerApplicationHandler from './routes/DeveloperApplication'

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

  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))

  app.get('/', (req, res) => {
    throw new Error('the thing failed')
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

  app.use((err, req, res, next) => {
    if (Array.isArray(err)) {
      err.forEach((error) => {console.error(error.message)})
    } else {
      console.error(err.message)
    }

    res.status(500).json({ error: 'encountered an error' })
  })

  return app
}
