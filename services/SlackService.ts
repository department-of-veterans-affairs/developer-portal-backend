import axios, { AxiosError, AxiosInstance } from 'axios';
import { DevPortalError } from '../models/DevPortalError';
import { MonitoredService, ServiceHealthCheckResponse } from '../types';
import { getEnvironment } from '../util/environments';
import { SignupCountResult } from './SignupMetricsService';

/*
 *WebAPISlackOptions are extras provided for specific APIs. Channel is related to messaging.
 *As in when chat.postMessage is called you have to specify a channel. Bot is related to the
 *healthcheck. We use the bot id as a idempotent call to see if the API is correctly setup
 *and usable. There may be more options in the future.
 */
interface WebAPISlackOptions {
  channel: string;
  bot: string;
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
  fields?: Array<{
    type: string;
    text: string;
    emoji?: boolean;
  }>;
}

interface PostBody {
  text?: string;
  blocks?: Block[];
  attachments?: Attachment[];
}

interface WebAPIHeaders {
  Authorization: string;
  'Content-Type': string;
}

interface WebAPIRequestConfig {
  baseURL?: string;
  headers: WebAPIHeaders;
}

interface SlackBotInfo {
  ok: boolean;
  error?: string;
  bot?: {
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

export interface SlackResponse {
  error?: string;
}

const capitalizeFirstLetter = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1);

export default class SlackService implements MonitoredService {
  private readonly client: AxiosInstance;

  private readonly options: WebAPISlackOptions;

  public constructor(baseURL: string, token: string, options: WebAPISlackOptions) {
    const config: WebAPIRequestConfig = {
      baseURL,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
    };
    this.client = axios.create(config);
    this.options = options;
  }

  public sendSuccessMessage(message: string, title: string): Promise<SlackResponse> {
    const body: PostBody = {
      attachments: [
        {
          color: 'good',
          fallback: message,
          text: message,
          title,
        },
      ],
      text: '',
    };

    return this.post(body);
  }

  public async sendSignupsMessage(
    duration: string,
    endDate: string,
    timeSpanSignups: SignupCountResult,
    allTimeSignups: SignupCountResult,
  ): Promise<SlackResponse> {
    const apis = Object.keys(timeSpanSignups.apiCounts);
    const numsByApi = apis.map(api => {
      const timeSpanCount = timeSpanSignups.apiCounts[api];
      const allTimeCount = allTimeSignups.apiCounts[api];
      return {
        text: `_${api}_: ${timeSpanCount} new requests (${allTimeCount} all-time)`,
        type: 'mrkdwn',
      };
    });
    const titleDuration = capitalizeFirstLetter(duration);

    const body: PostBody = {
      blocks: [
        {
          text: {
            text: `*${titleDuration}ly Sign-ups and Access Requests* for ${titleDuration} Ending ${endDate}`,
            type: 'mrkdwn',
          },
          type: 'section',
        },
        {
          text: {
            text: `*Environment:* ${getEnvironment()}`,
            type: 'mrkdwn',
          },
          type: 'section',
        },
        {
          type: 'divider',
        },
        {
          text: {
            text: '*New User Sign-ups* (excludes established users requesting additional APIs)',
            type: 'mrkdwn',
          },
          type: 'section',
        },
        {
          fields: [
            {
              text: `_This ${duration}:_ ${timeSpanSignups.total} new users`,
              type: 'mrkdwn',
            },
            {
              text: `_All-time:_ ${allTimeSignups.total} new users`,
              type: 'mrkdwn',
            },
          ],
          type: 'section',
        },
        {
          type: 'divider',
        },
        {
          text: {
            text: '*API Access Requests* (includes new users, and established users requesting additional APIs)',
            type: 'mrkdwn',
          },
          type: 'section',
        },
        {
          fields: numsByApi,
          type: 'section',
        },
        {
          type: 'divider',
        },
        {
          text: {
            text: '_Have questions about these numbers? Read <https://community.max.gov/display/VAExternal/Calculating Sandbox Signups|how we calculate signups>._',
            type: 'mrkdwn',
          },
          type: 'section',
        },
      ],
    };

    return this.post(body);
  }

  // Slack is considered healthy if <insert criteria>
  public async healthCheck(): Promise<ServiceHealthCheckResponse> {
    const healthResponse: ServiceHealthCheckResponse = {
      healthy: false,
      serviceName: 'Slack',
    };
    try {
      const botInfoResponse = await this.getBot();
      healthResponse.healthy = botInfoResponse.ok;
      return await Promise.resolve(healthResponse);
    } catch (err: unknown) {
      (err as DevPortalError).action = 'checking health of Slack';
      healthResponse.err = err as Error;
      return Promise.resolve(healthResponse);
    }
  }

  public async getBot(): Promise<SlackBotInfo> {
    const config = {
      params: {
        bot: this.options.bot,
      },
    };
    const botInfoResponse = await this.client.get<SlackBotInfo>('/api/bots.info', config);
    if (botInfoResponse.data.error) {
      throw new Error(botInfoResponse.data.error);
    }
    return botInfoResponse.data;
  }

  private async post(body: PostBody): Promise<SlackResponse> {
    try {
      const res = await this.client.post<SlackResponse>('/api/chat.postMessage', {
        channel: this.options.channel,
        ...body,
      });
      if (res.data.error) {
        throw new Error(res.data.error);
      }
      return res.data;
    } catch (err: unknown) {
      /*
       * Slack provides responses as text/html like 'invalid_payload' or 'channel_is_archived'.
       * We will want that information, so we're re-writing the message field of the error
       * that axios throws on 400 and 500 responses, since our default error handling
       * will accept and log that field.
       */
      const { response } = err as AxiosError;
      if (response) {
        (err as Error).message =
          `Status: ${response.status}, Data: ${JSON.stringify(response.data)}, ` +
          `Original: ${(err as AxiosError).message}`;
      }
      throw err;
    }
  }
}
