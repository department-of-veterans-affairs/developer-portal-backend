import axios, { AxiosResponse, AxiosInstance } from 'axios'

export default class SlackService {
  private channelID: string;
  private client: AxiosInstance;

  constructor(channelID: string, token: string) {
    this.channelID = channelID
    this.client = axios.create({
      baseURL: 'https://slack.com/api',
      headers: { 'Authorization': `Bearer ${token}` },
    })
  }

  public sendSuccessMessage(message: string, title: string): Promise<AxiosResponse> {
    return this.sendChatWithAttachment(message, 'good', title)
  }

  public sendFailureMessage(message: string, title: string): Promise<AxiosResponse> {
    return this.sendChatWithAttachment(message, 'danger', title)
  }

  private async sendChatWithAttachment(message: string, color: string, title: string): Promise<AxiosResponse> {
    return this.client.post('/chat.postMessage', {
      channel: this.channelID,
      text: '',
      attachments: [{
        text: message,
        fallback: message,
        color,
        title,
      }],
    })
  }
}
