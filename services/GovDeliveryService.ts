import * as Handlebars from 'handlebars';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { APIS_TO_PROPER_NAMES } from '../config/apis';
import { GovDeliveryUser, MonitoredService, ServiceHealthCheckResponse } from '../types';
import {
  WELCOME_TEMPLATE,
  PUBLISHING_SUPPORT_TEMPLATE,
  CONSUMER_SUPPORT_TEMPLATE,
} from '../templates';
import {  PRODUCTION_ACCESS_SUPPORT_TEMPLATE, PRODUCTION_ACCESS_CONSUMER_TEMPLATE } from '../templates/production';
import User from '../models/User';
import { DevPortalError } from '../models/DevPortalError';

interface EmailRecipient {
  email: string;
}

interface EmailRequest {
  subject: string;
  body: string;
  from_name: string;
  recipients: EmailRecipient[];
}

interface WelcomeEmail {
  apis: string;
  firstName: string;
  key?: string;
  kongUsername?: string;
  token_issued: boolean;
  oauth: boolean;
  clientID?: string;
  clientSecret?: string;
  redirectURI?: string;
}
export interface ConsumerSupportEmail {
  firstName: string;
  lastName: string;
  requester: string;
  description: string;
  organization?: string;
  apis?: string[];
}
export interface PublishingSupportEmail {
  firstName: string;
  lastName: string;
  requester: string;
  organization?: string;
  apiDetails: string;
  apiDescription?: string;
  apiInternalOnly: boolean;
  apiInternalOnlyDetails?: string;
  apiOtherInfo?: string;
}
export interface ContactDetails {
  firstName: string;
  lastName: string;
  email: string;
}
export interface ProductionAccessSupportEmail {
  primaryContact: ContactDetails;
  secondaryContact: ContactDetails;
  organization: string;
  appName: string;
  appDescription: string;
  statusUpdateEmails: string[];
  valueProvided: string;
  businessModel?: string;
  policyDocuments: string[];
  phoneNumber: string;
  apis?: string;
  monitizedVeteranInformation: boolean;
  monitizationExplanation?: string;
  veteranFacing?: boolean;
  website?: string;
  signUpLink?: string;
  supportLink?: string;
  platforms?: string[];
  veteranFacingDescription?: string;
  vasiSystemName?: string;
  credentialStorage: string;
  storePIIOrPHI: boolean;
  storageMethod?: string;
  safeguards?: string;
  breachManagementProcess?: string;
  vulnerabilityManagement?: string;
  exposeHealthInformationToThirdParties?: boolean;
  thirdPartyHealthInfoDescription?: string;
  scopesAccessRequested?: string[];
  distrubitingAPIKeysToCustomers?: boolean;
  namingConvention?: string;
  centralizedBackendLog?: string;
  listedOnMyHealthApplication?: boolean;
}
export interface ProductionAccessConsumerEmail {
  logo: string;
  stepOne: string;
  stepTwo: string;
  stepThree: string;
  stepFour: string;
}
export interface EmailResponse {
  from_name: string;
  from_email: string;
  reply_to: string;
  errors_to: string;
  subject: string;
  macros: {
    city: string;
    address: string;
    company: string;
    url: string;
  };
  body: string;
  click_tracking_enabled: boolean;
  open_tracking_enabled: boolean;
  message_type_code: string;
  created_at: string;
  _links: {
    self: string;
    email_template: string;
    recipients: string;
    clicked: string;
    opened: string;
  };
  status: string;
  recipient_counts: {
    total: number;
    new: number;
    sending: number;
    sent: number;
    failed: number;
    blacklisted: number;
    canceled: number;
  };
}

export interface EmailStatus {
  id: number;
  subject: string;
  created_at: string;
  status: string;
  _links: {
    self: string;
    recipients: string;
    failed: string;
    sent: string;
    clicked: string;
    opened: string;
  };
}
interface GovDeliveryServiceConfig {
  token: string;
  host: string;
  supportEmailRecipient: string;
}

export default class GovDeliveryService implements MonitoredService {
  public host: string;
  public supportEmailRecipient: string;
  public welcomeTemplate: Handlebars.TemplateDelegate<WelcomeEmail>;
  public consumerSupportTemplate: Handlebars.TemplateDelegate<ConsumerSupportEmail>;
  public publishingSupportTemplate: Handlebars.TemplateDelegate<PublishingSupportEmail>;
  public productionAccessSupportTemplate: Handlebars.TemplateDelegate<ProductionAccessSupportEmail>;
  public productionAccessConsumerTemplate: string;
  public client: AxiosInstance;

  constructor({ token, host, supportEmailRecipient }: GovDeliveryServiceConfig) {
    this.host = host;
    this.supportEmailRecipient = supportEmailRecipient;
    this.welcomeTemplate = Handlebars.compile(WELCOME_TEMPLATE);
    this.consumerSupportTemplate = Handlebars.compile(CONSUMER_SUPPORT_TEMPLATE);
    this.publishingSupportTemplate = Handlebars.compile(PUBLISHING_SUPPORT_TEMPLATE);
    this.productionAccessSupportTemplate = Handlebars.compile(PRODUCTION_ACCESS_SUPPORT_TEMPLATE);
    this.productionAccessConsumerTemplate = PRODUCTION_ACCESS_CONSUMER_TEMPLATE;
    this.client = axios.create({
      baseURL: this.host,
      headers: { 'X-AUTH-TOKEN': token },
    });
  }

  public sendWelcomeEmail(user: User): Promise<EmailResponse> {
    if (user.token || (user.oauthApplication && user.oauthApplication.client_id)) {
      const email: EmailRequest = {
        subject: 'Welcome to the VA API Platform',
        from_name: 'VA API Platform team',
        body: this.welcomeTemplate({
          apis: this.listApis(user),
          clientID: user.oauthApplication ? user.oauthApplication.client_id : '',
          clientSecret: user.oauthApplication ? user.oauthApplication.client_secret : '',
          firstName: user.firstName,
          oauth: !!user.oauthApplication,
          key: user.token,
          kongUsername: user.kongConsumerId ? user.consumerName() : '',
          token_issued: !!user.token,
          redirectURI:  user.oAuthRedirectURI,
        }),
        recipients: [{
          email: user.email,
        }],
      };

      return this.sendEmail(email);
    }

    throw Error('User must have token or client_id initialized');
  }

  public sendConsumerSupportEmail(supportRequest: ConsumerSupportEmail): Promise<EmailResponse> {
    const email: EmailRequest = {
      subject: 'Support Needed',
      from_name: `${supportRequest.firstName} ${supportRequest.lastName}`,
      body: this.consumerSupportTemplate(supportRequest),
      recipients: [{ email: this.supportEmailRecipient }],
    };

    return this.sendEmail(email);
  }

  public sendPublishingSupportEmail(supportRequest: PublishingSupportEmail): Promise<EmailResponse> {
    const email: EmailRequest = {
      subject: 'Publishing Support Needed',
      from_name: `${supportRequest.firstName} ${supportRequest.lastName}`,
      body: this.publishingSupportTemplate(supportRequest),
      recipients: [{ email: this.supportEmailRecipient }],
    };

    return this.sendEmail(email);
  }

  public sendProductionAccessEmail(supportRequest: ProductionAccessSupportEmail): Promise<EmailResponse> {
    const email: EmailRequest = {
      subject: 'Production Access Requested',
      from_name: `${supportRequest.primaryContact.firstName} ${supportRequest.primaryContact.lastName}`,
      body: this.productionAccessSupportTemplate(supportRequest),
      recipients: [{email: this.supportEmailRecipient}],
    };
    return this.sendEmail(email);
  }

  public sendProductionAccessConsumerEmail(emails: string[]): Promise<EmailResponse> {
    const mappedEmails: EmailRecipient[] = emails.map((x)=>{
      return {email: x};
    });
    const email: EmailRequest = {
      subject: 'Your Request for Production Access is Submitted',
      from_name: 'VA API Platform team',
      body: this.productionAccessConsumerTemplate,
      recipients: mappedEmails,
    };
    return this.sendEmail(email);
  }

  private async sendEmail(email: EmailRequest): Promise<EmailResponse> {
    const res: AxiosResponse<EmailResponse> = await this.client.post('/messages/email', email);
    return res.data;
  }

  private listApis(user: GovDeliveryUser): string {
    const apis = user.apiList;
    return apis.reduce((apiList, api, idx) => {
      const properName = APIS_TO_PROPER_NAMES[api];
      if (idx === 0) {
        return properName;
      } else if (idx === apis.length - 1 && apis.length === 2) {
        return `${apiList} and ${properName}`;
      } else if (idx === apis.length - 1 && apis.length > 2) {
        return `${apiList}, and ${properName}`;
      }
      return `${apiList}, ${properName}`;
    }, '');
  }

  // GovDelivery is considered healthy if <insert criteria>
  public async healthCheck(): Promise<ServiceHealthCheckResponse> {
    const healthResponse: ServiceHealthCheckResponse = {
      serviceName: 'GovDelivery',
      healthy: false,
    };
    try {
      healthResponse.healthy = await this.getEmailStatusList(1)
        .then(response => response.status === 200);
      return Promise.resolve(healthResponse);
    } catch (err: unknown) {
      (err as DevPortalError).action = 'checking health of GovDelivery';
      healthResponse.err = err as DevPortalError;
      return Promise.resolve(healthResponse);
    }
  }

  private async getEmailStatusList(pageSize: number): Promise<AxiosResponse<Array<EmailStatus>>> {
    let options;
    if (pageSize) {
      options = {
        params: {
          page_size: pageSize,
        },
      };
    }
    return this.client.get('/messages/email', options);
  }
}
