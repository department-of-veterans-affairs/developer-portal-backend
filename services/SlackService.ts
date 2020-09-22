import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { MonitoredService, ServiceHealthCheckResponse } from '../types';
import { SignupCountResult } from './SignupMetricsService';

/* 
WebAPISlackOptions are extras provided for specific APIs. Channel is related to messaging.
As in when chat.postMessage is called you have to specify a channel. Bot is related to the
healthcheck. We use the bot id as a idempotent call to see if the API is correctly setup
and usable. There may be more options in the future.
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
  fields?: {
    type: string;
    text: string;
    emoji?: boolean;
  }[];
}

interface PostBody {
  text?: string;
  blocks?: Block[];
  attachments?: Attachment[];
}

interface FileUpload {
  title: string;
  initialComment: string;
  fileType: string;
  fileName: string;
  content: string;
  /** Comma separated string of channels */
  channels: string;
}

interface FileUploadResponse {
  ok: boolean;
  error: string;
  needed: string;
  provided: string;
  warning: string;
}

interface WebAPIHeaders {
  'Authorization': string;
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

function capitalizeFirstLetter(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export default class SlackService implements MonitoredService {
  private client: AxiosInstance;
  private options: WebAPISlackOptions;

  constructor(baseURL: string, token: string, options: WebAPISlackOptions) {
    const config: WebAPIRequestConfig = {
      baseURL: baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    this.client = axios.create(config);
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

  public async sendConsumerReport(csvContent: string, apiList: string[] = [], requestedChannels?: string): Promise<string> {
    
    const apis: string = apiList.join(',');
    const channels = requestedChannels ? requestedChannels : this.options.channel;

    let apiString: string;
    switch (apiList.length) {
    case 0:
      apiString = 'all apis';
      break;
    case 1:
      apiString = `${apis} api`;
      break;
    default:
      apiString = `${apis} apis`;
      break;
    }

    const initialComment = `*Consumer Report* for ${apiString}`;

    // Post a thread
    const body: PostBody = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: initialComment,
          },
        },
      ],
    };

    const postResponse: any = await this.post(body);

    if (!postResponse.ok) {
      throw new Error(`Failed posting to Slack: Error: ${postResponse.error}, Needed: ${postResponse.needed}, Provided: ${postResponse.provided}, Warning: ${postResponse.warning}`);
    }

    const threadTs: string = postResponse.message.ts;

    const formData = new FormData();
    formData.append('channels', channels);
    formData.append('initial_comment', initialComment);
    formData.append('file', csvContent, {
      filename: `Consumer Report - ${apiString}.csv`,
    });
    formData.append('thread_ts', threadTs);
    
    const config = {
      headers: formData.getHeaders(),
    };

    const response: FileUploadResponse = await this.makeSlackRequest('/api/files.upload', formData, config);

    if (!response.ok) {
      throw new Error(`Failed uploading to Slack: Error: ${response.error}, Needed: ${response.needed}, Provided: ${response.provided}, Warning: ${response.warning}`);
    }
    return 'Successfully uploaded the file to Slack';
  }

  private async post(body: PostBody): Promise<any> {
    return this.makeSlackRequest('/api/chat.postMessage', { channel: this.options.channel, ...body });
  }

  private async makeSlackRequest(apiEndpoint: string, body: object, config?: object): Promise<any> {
    try {
      const res = await this.client.post(apiEndpoint, body, config);
      return res.data;
    }
    catch (err) {
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
      const botInfoResponse = await this.getBot();
      healthResponse.healthy = botInfoResponse.ok;
      return Promise.resolve(healthResponse);
    } catch (err) {
      err.action = 'checking health of Slack';
      healthResponse.err = err;
      return Promise.resolve(healthResponse);
    }
  }

  public async getBot(): Promise<SlackBotInfo> {
    const config = {
      params: {
        bot: this.options.bot,
      },
    };
    const botInfoResponse = await this.client.get('/api/bots.info', config);
    if(botInfoResponse.data.error){
      throw new Error(botInfoResponse.data.error);
    }
    return botInfoResponse.data;
  }
}
