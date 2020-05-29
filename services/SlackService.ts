import axios, { AxiosResponse, AxiosInstance } from 'axios';

export interface SlackChatResponse {
  ok: boolean;
  channel: string;
  ts: string;
  message: {
    text: string;
    username: string;
    bot_id: string;
    attachments: SlackAttachment[];
    type: string;
    subtype: string;
    ts: string;
  };
}

interface SlackAttachment {
  text: string;
  id: number;
  fallback: string;
}

export default class SlackService {
  private channelID: string;
  private client: AxiosInstance;

  constructor(channelID: string, token: string) {
    this.channelID = channelID;
    this.client = axios.create({
      baseURL: 'https://slack.com/api',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  }

  public sendSuccessMessage(message: string, title: string): Promise<SlackChatResponse> {
    return this.sendChatWithAttachment(message, 'good', title);
  }

  private async sendChatWithAttachment(message: string, color: string, title: string): Promise<SlackChatResponse> {
    const res: AxiosResponse<SlackChatResponse> = await this.client.post('/chat.postMessage', {
      channel: this.channelID,
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
}
