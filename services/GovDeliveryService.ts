import * as Handlebars from 'handlebars';
import request from 'request-promise-native';
import { format } from 'url';
import { apisToProperNames } from '../config';
import { GovDeliveryUser, Protocol } from '../types';

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

const EMAIL_SUBJECT = 'Welcome to the VA API Platform';
const DUMP_SUBJECT = 'Daily User Registrations on Developer Portal';
const EMAIL_TEMPLATE = `<div>Welcome {{ firstName }},</div><br />

<div>Thank you for your interest in our {{ apis }}. We are excited to partner with you to improve the lives of veterans.</div><br />

{{# if token_issued}}
<div>Here's your key for accessing the development environment: <pre>{{ key }}</pre></div><br />

<div>You can use your key by including it as an HTTP request header <pre>apiKey: {{ key }}</pre> in your requests to the API. You can find additional documentation at <a href="https://developer.va.gov">developer.va.gov</a></div><br />
{{/if}}

{{#if oauth }}
<div>Here's your OAuth Client ID: <pre>{{ clientID }}</pre></div><br />

{{#if clientSecret}}
<div>Here's your OAuth Client Secret: <pre>{{ clientSecret }}</pre></div><br />
{{/if}}

<div>Please visit our OAuth documentation for implementation guidelines: <a href="https://developer.va.gov/oauth">developer.va.gov/oauth</a></div><br />
{{/if}}

<div>If you find a bug or would like to make a feature request, please open an issue through our Support page. We are continually working to improve our process and welcome <a href="https://developer.va.gov/support">feedback along your journey</a>.</div><br />

<div>When you're ready to move to a production environment, please follow the steps outlined on our <a href="https://developer.va.gov/go-live">Path to Production</a> page.</div><br />

<div>Thank you again,</div>
<div>VA API Platform Team</div> <br />
<div><strong>Read VA API Docs at: </strong><a href="https://developer.va.gov">developer.va.gov</a></div>
<div><strong>Get support: </strong><a href="https://github.com/department-of-veterans-affairs/vets-api-clients/issues/new/choose">Create Github Issue</a></div>
<div><strong>Email us at: </strong><a href="mailto:api@va.gov">api@va.gov</a></div>
`;

export default class GovDeliveryService {
  public authToken: string;
  public protocol: Protocol = 'https';
  public host: string;
  public welcomeTemplate: Handlebars.TemplateDelegate<WelcomeEmail>;

  constructor({ token, host }) {
    this.authToken = token;
    this.host = host;
    this.welcomeTemplate = Handlebars.compile(EMAIL_TEMPLATE);
  }

  public sendDumpEmail(csvDump: string, sendTo: string[]): Promise<EmailResponse> {
    const email: EmailRequest = {
      subject: DUMP_SUBJECT,
      from_name: 'VA API Platform team',
      body: csvDump,
      recipients: sendTo.map((email) => ({ email })),
    };
    return request.post(this.requestOptions('/messages/email', email));
  }

  public sendWelcomeEmail(user: GovDeliveryUser): Promise<EmailResponse> {
    if (user.token || (user.oauthApplication && user.oauthApplication.client_id)) {
      const template = this.welcomeTemplate;
      const email: EmailRequest = {
        subject: EMAIL_SUBJECT,
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
      return request.post(this.requestOptions('/messages/email', email));
    } 
    
    throw Error('User must have token or client_id initialized');
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
