import axios, {AxiosInstance } from 'axios';

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

export default class SlackService {
  private client: AxiosInstance;
  private options: WebhookOptions;

  constructor(webhook: string, options: WebhookOptions) {
    this.client = axios.create({ baseURL: webhook });
    this.options = options;
  }

  public sendSuccessMessage(message: string, title: string): Promise<string> {
    return this.sendChatWithAttachment(message, 'good', title);
  }

  private async sendChatWithAttachment(message: string, color: string, title: string): Promise<string> {
    try {
      const res = await this.client.post('', {
        ...this.options,
        text: '',
        attachments: [{
          text: message,
          fallback: message,
          color,
          title,
        }],
      });

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
}