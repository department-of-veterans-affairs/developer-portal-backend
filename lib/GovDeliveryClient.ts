import fs from 'fs';
import * as Handlebars from 'handlebars';
import * as request from 'request-promise-native';
import { format } from 'url';
import { apisToProperNames } from './config';
import { GovDeliveryUser, Protocol } from './types';

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

const EMAIL_SUBJECT = 'Welcome to the VA API Platform';
const DUMP_SUBJECT = 'Daily User Registrations on Developer Portal';

export class GovDeliveryClient {
  public authToken: string;
  public protocol: Protocol = 'https';
  public host: string;
  public welcomeTemplate: Promise<Handlebars.TemplateDelegate<WelcomeEmail>>;

  constructor({ token, host }) {
    this.authToken = token;
    this.host = host;
    this.welcomeTemplate = new Promise((resolve, reject) => {
      fs.readFile(`${__dirname}/emails/welcomeEmail.html.hbs`, 'utf-8', (err, source) => {
        if (err) {
          reject(err);
        } else {
          resolve(Handlebars.compile(source));
        }
      });
    });
  }

  public async sendDumpEmail(csvDump: string, sendTo: string[]) {
    const email: EmailRequest = {
      subject: DUMP_SUBJECT,
      from_name: 'VA API Platform team',
      body: csvDump,
      recipients: sendTo.map((email) => ({ email })),
    };
    return await request.post(this.requestOptions('/messages/email', email));
  }

  public async sendWelcomeEmail(user: GovDeliveryUser) {
    if (user.token || (user.oauthApplication && user.oauthApplication.client_id)) {
      const template = await this.welcomeTemplate;
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
      return await request.post(this.requestOptions('/messages/email', email));
    }
    throw Error('User must have token or client_id initialized');
  }

  private listApis(user: GovDeliveryUser) {
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
