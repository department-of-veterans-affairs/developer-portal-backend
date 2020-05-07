import { DynamoDB } from 'aws-sdk';
import pick from 'lodash.pick';
import process from 'process';
import { ApplicationType } from '../types';
import { GovDeliveryUser, KongUser } from '../types';
import { Application } from './Application';
import logger from '../config/logger';
import OktaService from '../services/OktaService';
import SlackService from '../services/SlackService';
import KongService from '../services/KongService';
import GovDeliveryService from '../services/GovDeliveryService';

const KONG_CONSUMER_APIS = ['benefits', 'facilities', 'vaForms', 'confirmation'];
const OKTA_CONSUMER_APIS = [
  'health',
  'verification',
  'communityCare',
  'claims',
];

export default class User implements KongUser, GovDeliveryUser {
  public createdAt: Date;
  public firstName: string;
  public lastName: string;
  public organization: string;
  public email: string;
  public apis: string;
  public description: string;
  public oAuthRedirectURI: string;
  public oAuthApplicationType?: string;
  public kongConsumerId?: string;
  public token?: string;
  public oauthApplication?: Application;
  public tableName: string = process.env.DYNAMODB_TABLE || 'Users';
  public tosAccepted: boolean;

  constructor({
    firstName,
    lastName,
    organization,
    email,
    apis,
    description,
    oAuthRedirectURI,
    oAuthApplicationType,
    termsOfService,
  }) {
    this.createdAt = new Date();
    this.firstName = firstName;
    this.lastName = lastName;
    this.organization = organization;
    this.email = email;
    this.apis = apis;
    this.description = description;
    this.oAuthRedirectURI = oAuthRedirectURI;
    this.oAuthApplicationType = oAuthApplicationType;
    this.tosAccepted = termsOfService;
  }

  public consumerName(): string {
    return `${this.organization}${this.lastName}`.replace(/\W/g, '');
  }

  public toSlackString(): string {
    const intro = `${this.lastName}, ${this.firstName}: ${this.email}\nDescription: ${this.description}\nRequested access to:\n`;
    return this.apiList.reduce((m, api) => m.concat(`* ${api}\n`), intro);
  }

  public get apiList(): string[] {
    return this._apiList;
  }

  public async saveToKong(client: KongService) {
    try {
      const consumer = await client.createConsumer(this);
      this.kongConsumerId = consumer.id;
      await client.createACLs(this);
      const keyAuth = await client.createKeyAuth(this);
      this.token = keyAuth.key;
      return this;
    } catch (error) {
      error.action = 'failed creating kong consumer';
      throw error;
    }
  }

  public async sendEmail(client: GovDeliveryService) {
    try {
      return await client.sendWelcomeEmail(this);
    } catch (error) {
      error.action = 'failed sending welcome email';
      throw error;
    }
  }

  public async sendSlackSuccess(client: SlackService) {
    try {
      return await client.sendSuccessMessage(
        this.toSlackString(),
        'New User Application',
      );
    } catch (error) {
      error.action = 'failed sending slack success';
      throw error;
    }
  }

  public async sendSlackFailure(client: SlackService) {
    try {
      return await client.sendFailureMessage(
        this.toSlackString(),
        'User signup failed',
      );
    } catch (error) {
      error.action = 'failed sending slack failure';
      throw error;
    }
  }

  public saveToDynamo(client: DynamoDB.DocumentClient): Promise<User> {
    const dynamoItem = pick(this, [
      'apis',
      'email',
      'firstName',
      'lastName',
      'organization',
      'oAuthRedirectURI',
      'kongConsumerId',
      'tosAccepted',
    ]);
    dynamoItem.description =
      this.description === '' ? 'no description' : this.description;
    dynamoItem.createdAt = this.createdAt.toISOString();

    if (this.oauthApplication && this.oauthApplication.oktaID) {
      dynamoItem.okta_application_id = this.oauthApplication.oktaID;
      dynamoItem.okta_client_id = this.oauthApplication.client_id;
    }

    Object.keys(dynamoItem).forEach((k) => {
      if (dynamoItem[k] === '') {
        logger.debug({ message: `converting ${k} from empty string to null` });
        dynamoItem[k] = null;
      }
    });

    return new Promise((resolve, reject) => {
      const params = {
        Item: dynamoItem,
        TableName: this.tableName,
      };

      client.put(params, (err, data) => {
        if (err) {
          const dynamoErr = new Error(err.message);
          reject(dynamoErr);
        }
        resolve(this);
      });
    });
  }

  public async saveToOkta(client: OktaService): Promise<User> {
    try {
      // Don't error if there's no Redirect URI supplied to avoid breaking API
      if (this.oAuthRedirectURI !== '') {
        this.oauthApplication = new Application(
          {
            applicationType: this.oAuthApplicationType as ApplicationType,
            // Save with the consumerName + current date in ISO format to avoid name clashes
            // Without accounts there isn't a good way to look up and avoid creating applications
            // with the same name which isn't allowed by Okta
            name: `${this.consumerName()}-${this.createdAt.toISOString()}`,
            redirectURIs: [this.oAuthRedirectURI],
          },
          this,
        );
        if (this.oauthApplication) {
          await this.oauthApplication.createOktaApplication(client);
        }
      }
      return this;
    } catch (err) {
      err.action = 'failed saving to okta';
      throw err;
    }
  }

  public shouldUpdateKong(): boolean {
    const isKongApi = api => this.apiList.includes(api);
    return KONG_CONSUMER_APIS.filter(isKongApi).length > 0;
  }

  public shouldUpdateOkta(): boolean {
    const isOktaApi = api => this.apiList.includes(api);
    return OKTA_CONSUMER_APIS.filter(isOktaApi).length > 0;
  }

  private get _apiList(): string[] {
    if (this.apis) {
      return this.apis.split(',');
    }
    return [];
  }
}
