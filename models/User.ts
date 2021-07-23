import process from 'process';
import { ApplicationType } from '@okta/okta-sdk-nodejs';
import { GovDeliveryUser, KongUser } from '../types';
import OktaService from '../services/OktaService';
import SlackService, { SlackResponse } from '../services/SlackService';
import KongService from '../services/KongService';
import GovDeliveryService, { EmailResponse } from '../services/GovDeliveryService';
import DynamoService from '../services/DynamoService';
import { KONG_CONSUMER_APIS, OKTA_CONSUMER_APIS } from '../config/apis';
import Application from './Application';
import { DevPortalError } from './DevPortalError';

type APIFilterFn = (api: string) => boolean;

export interface UserDynamoItem {
  apis: string;
  email: string;
  firstName: string;
  lastName: string;
  organization: string;
  oAuthRedirectURI: string;
  kongConsumerId?: string;
  tosAccepted: boolean;
  description: string;
  createdAt: string;
  okta_application_id?: string;
  okta_client_id?: string;
}
export interface UserConfig {
  firstName: string;
  lastName: string;
  organization: string;
  email: string;
  apis: string;
  description: string;
  oAuthRedirectURI: string;
  oAuthApplicationType?: string;
  termsOfService: boolean;
}

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

  public tableName: string = process.env.DYNAMODB_TABLE ?? 'Users';

  public tosAccepted: boolean;

  public constructor({
    firstName,
    lastName,
    organization,
    email,
    apis,
    description,
    oAuthRedirectURI,
    oAuthApplicationType,
    termsOfService,
  }: UserConfig) {
    this.createdAt = new Date(Date.now());
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

  public get apiList(): string[] {
    // eslint-disable-next-line no-underscore-dangle
    return this._apiList;
  }

  public async saveToKong(client: KongService): Promise<User> {
    try {
      const consumer = await client.createConsumer(this);
      this.kongConsumerId = consumer.id;
      await client.createACLs(this);
      const keyAuth = await client.createKeyAuth(this);
      this.token = keyAuth.key;
      return this;
    } catch (err: unknown) {
      (err as DevPortalError).action = 'failed creating kong consumer';
      throw err;
    }
  }

  public sendEmail(client: GovDeliveryService): Promise<EmailResponse> {
    try {
      return client.sendWelcomeEmail(this);
    } catch (err: unknown) {
      (err as DevPortalError).action = 'failed sending welcome email';
      throw err;
    }
  }

  public sendSlackSuccess(client: SlackService): Promise<SlackResponse> {
    try {
      return client.sendSuccessMessage(this.toSlackString(), 'New User Application');
    } catch (err: unknown) {
      (err as DevPortalError).action = 'failed sending slack success';
      throw err;
    }
  }

  public async saveToDynamo(service: DynamoService): Promise<User> {
    try {
      const dynamoItem: UserDynamoItem = {
        apis: this.apis,
        createdAt: this.createdAt.toISOString(),
        description: this.description || 'no description',
        email: this.email,
        firstName: this.firstName,
        kongConsumerId: this.kongConsumerId,
        lastName: this.lastName,
        oAuthRedirectURI: this.oAuthRedirectURI,
        organization: this.organization,
        tosAccepted: this.tosAccepted,
      };

      if (this.oauthApplication?.oktaID) {
        dynamoItem.okta_application_id = this.oauthApplication.oktaID;
        dynamoItem.okta_client_id = this.oauthApplication.client_id;
      }

      await service.putItem(dynamoItem, this.tableName);
      return this;
    } catch (err: unknown) {
      (err as DevPortalError).action = 'failed saving to dynamo';
      throw err;
    }
  }

  public async saveToOkta(client: OktaService): Promise<User> {
    try {
      // Don't error if there's no Redirect URI supplied to avoid breaking API
      if (this.oAuthRedirectURI !== '') {
        this.oauthApplication = new Application(
          {
            applicationType: this.oAuthApplicationType as ApplicationType,
            /*
             * Save with the consumerName + current date in ISO format to avoid name clashes
             * Without accounts there isn't a good way to look up and avoid creating applications
             * with the same name which isn't allowed by Okta
             */
            name: `${this.consumerName()}-${this.createdAt.toISOString()}`,
            redirectURIs: [this.oAuthRedirectURI],
          },
          this,
        );

        await this.oauthApplication.createOktaApplication(client);
      }
      return this;
    } catch (err: unknown) {
      (err as DevPortalError).action = 'failed saving to okta';
      throw err;
    }
  }

  public shouldUpdateKong(): boolean {
    const isKongApi: APIFilterFn = api => this.apiList.includes(api);
    return KONG_CONSUMER_APIS.some(isKongApi);
  }

  public shouldUpdateOkta(): boolean {
    const isOktaApi: APIFilterFn = api => this.apiList.includes(api);
    return OKTA_CONSUMER_APIS.some(isOktaApi);
  }

  private get _apiList(): string[] {
    if (this.apis) {
      return this.apis.split(',');
    }
    return [];
  }

  private toSlackString(): string {
    const intro = `${this.lastName}, ${this.firstName}: ${this.email}\nDescription: ${this.description}\nRequested access to:\n`;
    return this.apiList.reduce((m, api) => m.concat(`* ${api}\n`), intro);
  }
}
