import axios, {AxiosInstance } from 'axios';
import { MonitoredService, ServiceHealthCheckResponse } from '../types';

/* 
WebhookOptions override the defaults configured in the webhook
in Slack. The username field is what the message will be posted as.
The channel field is the name of a channel like #dev-signup-feed,
including the hash.
*/
interface WebhookOptions {
  channel: string;
  username: string;
  icon_emoji?: string;
  icon?: string;
}

export interface ApplyWrapup {
  duration: 'week' | 'month';
  numApplications: number;
  numByApi: { name: string; num: number }[];
}

interface Attachment {
  text: string;
  fallback: string;
  color: string;
  title: string;
}

interface Block {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  fields?: {
    type: string;
    text: string;
    emoji: boolean;
  }[];
}

interface PostBody {
  text: string;
  blocks?: Block[];
  attachments?:  Attachment[];
}

export default class SlackService implements MonitoredService {
  private client: AxiosInstance;
  private options: WebhookOptions;

  constructor(webhook: string, options: WebhookOptions) {
    this.client = axios.create({ baseURL: webhook });
    this.options = options;
  }

  public sendSuccessMessage(message: string, title: string): Promise<string> {
    const body: PostBody = {
        text: '',
        attachments: [{
          text: message,
          fallback: message,
          color: 'good',
          title,
        }],
    };

    return this.post(body);
  }
  
  public async sendWrapUpMessage(req: ApplyWrapup): Promise<string> {
    const numsByApi = req.numByApi.map(api => ({ type: 'plain_text', text: `${api.name}: ${api.num}`, emoji: false }));

    const body: PostBody = {
      text: `${req.duration} sandbox applications report`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${req.numApplications} people applied for Sandbox keys this ${req.duration}.`
          }
        },
        { type: 'divider' },
        {
          type: 'section',
          fields: numsByApi,
        },
        { type: 'divider' },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '_Numbers not what you expect? Read <https://google.com|how we calculate signups>._'
          }
        }
      ],
    };

    return this.post(body);
  }

  private async post(body: PostBody): Promise<string> {
    try {
      const res = await this.client.post('', { ...this.options, ...body });
      return res.data;
    }
    catch (err) {
      // Slack provides responses as text/html like 'invalid_payload' or 'channel_is_archived'.
      // We will want that information, so we're re-writing the message field of the error
      // that axios throws on 400 and 500 responses, since our default error handling
      // will accept and log that field.
      if (err.response) {
        err.message = `Status: ${err.response.status}, Data: ${err.response.data}, Original: ${err.message}`;
      }
      throw err;
    }
  }

  // Slack is considered healthy if <insert criteria>
  public async healthCheck(): Promise<ServiceHealthCheckResponse> {
    return await Promise.resolve({
      serviceName: 'Slack',
      healthy: true,
    });
  }
}
