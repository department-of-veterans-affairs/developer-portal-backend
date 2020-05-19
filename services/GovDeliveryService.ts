import * as Handlebars from 'handlebars';
import request from 'request-promise-native';
import { format } from 'url';
import { apisToProperNames } from '../config';
import { GovDeliveryUser, Protocol } from '../types';
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
  public authToken: string;
  public protocol: Protocol = 'https';
  public host: string;
  public supportEmail: string;
  public welcomeTemplate: Handlebars.TemplateDelegate<WelcomeEmail>;
  public supportTemplate: Handlebars.TemplateDelegate<SupportEmail>;

  constructor({ token, host, supportEmail }) {
    this.authToken = token;
    this.host = host;
    this.supportEmail = supportEmail;
    this.welcomeTemplate = Handlebars.compile(WELCOME_TEMPLATE);
    this.supportTemplate = Handlebars.compile(SUPPORT_TEMPLATE);
  }

  public sendWelcomeEmail(user: GovDeliveryUser): Promise<EmailResponse> {
    if (user.token || (user.oauthApplication && user.oauthApplication.client_id)) {
      const template = this.welcomeTemplate;
      const email: EmailRequest = {
        subject: 'Welcome to the VA API Platform',
        from_name: 'VA API Platform team',
        body: template({
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
      recipients: [ { email: this.supportEmail }]
    };

    return this.sendEmail(email);
  }

  private sendEmail(email: EmailRequest): Promise<EmailResponse> {
    return request.post(this.requestOptions('/messages/email', email));
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

  private requestOptions(path: string, body: EmailRequest): request.Options {
    const url = format({
      protocol: this.protocol,
      hostname: this.host,
      pathname: path,
    });
    const headers = {
      'X-AUTH-TOKEN': this.authToken,
    };
    return { body, url, headers, json: true };
  }
}
