import axios, {AxiosInstance, AxiosResponse } from 'axios';
import { MonitoredService, ServiceHealthCheckResponse } from '../types';
import { SignupCountResult } from './SignupMetricsService';
import logger from '../config/logger';

/* 
WebhookOptions override the defaults configured in the webhook
in Slack. The username field is what the message will be posted as.
The channel field is the name of a channel like #dev-signup-feed,
including the hash.
*/
interface WebAPIOptions {
  channel?: string;
  bot?: string;
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
    emoji?: boolean;
  }[];
}

interface PostBody {
  text?: string;
  blocks?: Block[];
  attachments?:  Attachment[];
}

interface WebAPIHeaders {
  'Authorization'?: string;
  'Content-Type'?: string;
}

interface WebAPIConfig {
  baseURL?: string;
  headers: WebAPIHeaders;
}

interface SlackBotInfo {
  ok: boolean;
  bot: {
    id: string;
    deleted: boolean;
    name: string;
    updated: number;
    app_id: string;
    user_id: string;
    icons: {
      image_36: string;
      image_48: string;
      image_72: string;
    };
  };
}

function capitalizeFirstLetter(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export default class SlackService implements MonitoredService {
  private client: AxiosInstance;
  private options: WebAPIOptions;
  private config: WebAPIConfig;

  constructor(url: string, token: string, options: WebAPIOptions) {
    this.config = {
      baseURL: url,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    this.client = axios.create(this.config);
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
  
  public async sendSignupsMessage(
    duration: string, 
    endDate: string,
    timeSpanSignups: SignupCountResult, 
    allTimeSignups: SignupCountResult
  ): Promise<string> {
    const apis = Object.keys(timeSpanSignups.apiCounts);
    const numsByApi = apis.map(api => {
      return {
        type: 'mrkdwn',
        text: `_${api}_: ${timeSpanSignups.apiCounts[api]} new requests (${allTimeSignups.apiCounts[api]} all-time)`, 
      };
    });
    const titleDuration = capitalizeFirstLetter(duration);

    const body: PostBody = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${titleDuration}ly Sign-ups and Access Requests* for ${titleDuration} Ending ${endDate}`,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*New User Sign-ups* (excludes established users requesting additional APIs)',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `_This ${duration}:_ ${timeSpanSignups.total} new users`,
            },
            {
              type: 'mrkdwn',
              text: `_All-time:_ ${allTimeSignups.total} new users`,
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*API Access Requests* (includes new users, and established users requesting additional APIs)',
          },
        },
        {
          type: 'section',
          fields: numsByApi,
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '_Have questions about these numbers? Read <https://community.max.gov/display/VAExternal/Calculating Sandbox Signups|how we calculate signups>._',
          },
        },
      ],
    };

    return this.post(body);
  }

  private async post(body: PostBody): Promise<string> {
    try {
      const res = await this.client.post('/api/chat.postMessage', { channel: this.options.channel, ...body });
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
    const healthResponse: ServiceHealthCheckResponse = {
      serviceName: 'Slack',
      healthy: false,
    };
    try {
      healthResponse.healthy = (await this.getBot()).data.ok;
      return Promise.resolve(healthResponse);
    } catch (err) {
      logger.error(err);
      err.action = 'checking health of Slack';
      healthResponse.err = err;
      return Promise.resolve(healthResponse);
    }
  }

  public async getBot(): Promise<AxiosResponse<SlackBotInfo>> {
    const config = {
      params: {
        bot: this.options.bot,
      },
    };
    return await this.client.get('/api/bots.info', config);
  }
}
