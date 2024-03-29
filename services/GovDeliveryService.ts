/* eslint-disable max-lines */
import * as Handlebars from 'handlebars';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { APIS_TO_PROPER_NAMES } from '../config/apis';
import { GovDeliveryUser, MonitoredService, ServiceHealthCheckResponse } from '../types';
import {
  WELCOME_TEMPLATE,
  PUBLISHING_SUPPORT_TEMPLATE,
  CONSUMER_SUPPORT_TEMPLATE,
  VA_PROFILE_DISTRIBUTION_TEMPLATE,
} from '../templates';
import {
  PRODUCTION_ACCESS_SUPPORT_TEMPLATE,
  PRODUCTION_ACCESS_CONSUMER_TEMPLATE,
} from '../templates/production';
import User from '../models/User';
import { DevPortalError } from '../models/DevPortalError';
import { ProductionAccessSupportEmail } from '../types/ProductionAccess';

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

export interface VAProfileDistributionEmail {
  firstName: string;
  lastName: string;
  requester: string;
  description: string;
  organization?: string;
  apis: string;
  programName: string;
  sponsorEmail: string;
  vaEmail: string;
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
  vaProfileDistributionRecipient: string;
}

export default class GovDeliveryService implements MonitoredService {
  public host: string;

  public supportEmailRecipient: string;

  public vaProfileDistributionRecipient: string;

  public welcomeTemplate: Handlebars.TemplateDelegate<WelcomeEmail>;

  public consumerSupportTemplate: Handlebars.TemplateDelegate<ConsumerSupportEmail>;

  public publishingSupportTemplate: Handlebars.TemplateDelegate<PublishingSupportEmail>;

  public productionAccessSupportTemplate: Handlebars.TemplateDelegate<ProductionAccessSupportEmail>;

  public vaProfileDistributionTemplate: Handlebars.TemplateDelegate<VAProfileDistributionEmail>;

  public productionAccessConsumerTemplate: string;

  public client: AxiosInstance;

  public constructor({
    token,
    host,
    supportEmailRecipient,
    vaProfileDistributionRecipient,
  }: GovDeliveryServiceConfig) {
    this.host = host;
    this.supportEmailRecipient = supportEmailRecipient;
    this.vaProfileDistributionRecipient = vaProfileDistributionRecipient;
    this.welcomeTemplate = Handlebars.compile(WELCOME_TEMPLATE);
    this.consumerSupportTemplate = Handlebars.compile(CONSUMER_SUPPORT_TEMPLATE);
    this.publishingSupportTemplate = Handlebars.compile(PUBLISHING_SUPPORT_TEMPLATE);
    this.productionAccessSupportTemplate = Handlebars.compile(PRODUCTION_ACCESS_SUPPORT_TEMPLATE);
    this.vaProfileDistributionTemplate = Handlebars.compile(VA_PROFILE_DISTRIBUTION_TEMPLATE);
    this.productionAccessConsumerTemplate = PRODUCTION_ACCESS_CONSUMER_TEMPLATE;
    this.client = axios.create({
      baseURL: this.host,
      headers: { 'X-AUTH-TOKEN': token },
    });
  }

  private static listApis(user: GovDeliveryUser): string {
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

  public async healthCheck(): Promise<ServiceHealthCheckResponse> {
    const healthResponse: ServiceHealthCheckResponse = {
      healthy: false,
      serviceName: 'GovDelivery',
    };
    try {
      healthResponse.healthy = await this.getEmailStatusList(1).then(
        response => response.status === 200,
      );
      return await Promise.resolve(healthResponse);
    } catch (err: unknown) {
      (err as DevPortalError).action = 'checking health of GovDelivery';
      healthResponse.err = err as DevPortalError;
      return Promise.resolve(healthResponse);
    }
  }

  public sendWelcomeEmail(user: User, emailAddress?: string): Promise<EmailResponse> {
    if (user.token || user.oauthApplication?.client_id) {
      const email: EmailRequest = {
        body: this.welcomeTemplate({
          apis: GovDeliveryService.listApis(user),
          clientID: user.oauthApplication ? user.oauthApplication.client_id : '',
          clientSecret: user.oauthApplication ? user.oauthApplication.client_secret : '',
          firstName: user.firstName,
          key: user.token,
          kongUsername: user.kongConsumerId ? user.consumerName() : '',
          oauth: !!user.oauthApplication,
          redirectURI: user.oAuthRedirectURI,
          token_issued: !!user.token,
        }),
        from_name: 'VA API Platform team',
        recipients: [
          {
            email: emailAddress ?? user.email,
          },
        ],
        subject: 'Welcome to the VA API Platform',
      };

      return this.sendEmail(email);
    }

    throw Error('User must have token or client_id initialized');
  }

  public sendConsumerSupportEmail(supportRequest: ConsumerSupportEmail): Promise<EmailResponse> {
    const email: EmailRequest = {
      body: this.consumerSupportTemplate(supportRequest),
      from_name: `${supportRequest.firstName} ${supportRequest.lastName}`,
      recipients: [{ email: this.supportEmailRecipient }],
      subject: 'Support Needed',
    };

    return this.sendEmail(email);
  }

  public sendPublishingSupportEmail(
    supportRequest: PublishingSupportEmail,
  ): Promise<EmailResponse> {
    const email: EmailRequest = {
      body: this.publishingSupportTemplate(supportRequest),
      from_name: `${supportRequest.firstName} ${supportRequest.lastName}`,
      recipients: [{ email: this.supportEmailRecipient }],
      subject: 'Publishing Support Needed',
    };

    return this.sendEmail(email);
  }

  public sendProductionAccessEmail(
    supportRequest: ProductionAccessSupportEmail,
  ): Promise<EmailResponse> {
    const email: EmailRequest = {
      body: this.productionAccessSupportTemplate(supportRequest),
      from_name: `${supportRequest.primaryContact.firstName} ${supportRequest.primaryContact.lastName}`,
      recipients: [{ email: this.supportEmailRecipient }],
      subject: `Production Access Requested for ${supportRequest.organization}`,
    };
    return this.sendEmail(email);
  }

  // eslint-disable-next-line id-length
  public sendProductionAccessConsumerEmail(emails: string[]): Promise<EmailResponse> {
    const mappedEmails: EmailRecipient[] = emails.map(x => ({ email: x }));
    const email: EmailRequest = {
      body: this.productionAccessConsumerTemplate,
      from_name: 'VA API Platform team',
      recipients: mappedEmails,
      subject: 'Your Request for Production Access is Submitted',
    };
    return this.sendEmail(email);
  }

  public sendVAProfileDistributionEmail(user: User): Promise<EmailResponse> {
    const email: EmailRequest = {
      body: this.vaProfileDistributionTemplate({
        apis: GovDeliveryService.listApis(user),
        description: user.description,
        firstName: user.firstName,
        lastName: user.lastName,
        organization: user.organization,
        programName: user.programName ?? '',
        requester: user.email,
        sponsorEmail: user.sponsorEmail ?? '',
        vaEmail: user.vaEmail ?? '',
      }),
      from_name: `${user.firstName} ${user.lastName}`,
      recipients: [{ email: this.vaProfileDistributionRecipient }],
      subject: 'VA Profile Signup Request',
    };

    return this.sendEmail(email);
  }

  private async sendEmail(email: EmailRequest): Promise<EmailResponse> {
    const res: AxiosResponse<EmailResponse> = await this.client.post('/messages/email', email);
    return res.data;
  }

  private async getEmailStatusList(pageSize: number): Promise<AxiosResponse<EmailStatus[]>> {
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
