import * as Handlebars from 'handlebars';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { apisToProperNames } from '../config';
import { GovDeliveryUser } from '../types';
import { WELCOME_TEMPLATE, SUPPORT_TEMPLATE } from '../templates';

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
  token_issued: boolean;
  oauth: boolean;
  clientID?: string;
  clientSecret?: string;
}

export interface SupportEmail {
  firstName: string;
  lastName: string;
  requester: string;
  description: string;
  organization?: string;
  apis?: string[];
}

interface EmailResponse {
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

export default class GovDeliveryService {
  public host: string;
  public supportEmailRecipient: string;
  public welcomeTemplate: Handlebars.TemplateDelegate<WelcomeEmail>;
  public supportTemplate: Handlebars.TemplateDelegate<SupportEmail>;
  public client: AxiosInstance;

  constructor({ token, host, supportEmailRecipient }) {
    this.host = host;
    this.supportEmailRecipient = supportEmailRecipient;
    this.welcomeTemplate = Handlebars.compile(WELCOME_TEMPLATE);
    this.supportTemplate = Handlebars.compile(SUPPORT_TEMPLATE);
    this.client = axios.create({
      baseURL: `https://${this.host}`,
      headers: { 'X-AUTH-TOKEN': token }
    });
  }

  public sendWelcomeEmail(user: GovDeliveryUser): Promise<EmailResponse> {
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
          token_issued: !!user.token,
        }),
        recipients: [{
          email: user.email,
        }],
      };

      return this.sendEmail(email);
    } 
    
    throw Error('User must have token or client_id initialized');
  }
  
  public sendSupportEmail(supportRequest: SupportEmail): Promise<EmailResponse> {
    const email: EmailRequest = {
      subject: 'Support Needed',
      from_name: `${supportRequest.firstName} ${supportRequest.lastName}`,
      body: this.supportTemplate(supportRequest),
      recipients: [ { email: this.supportEmailRecipient }]
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
      const properName = apisToProperNames[api];
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
}