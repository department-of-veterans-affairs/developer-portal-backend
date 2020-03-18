import { WebClient } from '@slack/client';

export class SlackClient {
  public client: WebClient;
  public token: string;
  public channelID: string;

  constructor({ token, channelID }) {
    this.channelID = channelID;
    this.token = token;
    this.client = new WebClient(token);
  }

  public async sendSuccessMessage(message: string, title: string) {
    return await this.sendAttachmentMessage(message, 'good', title);
  }

  public async sendFailureMessage(message: string, title: string) {
    return await this.sendAttachmentMessage(message, 'danger', title);
  }

  private async sendAttachmentMessage(message: string, color: string, title: string) {
    try {
      return this.client.chat.postMessage({
        channel: this.channelID,
        text: '',
        attachments: [{
          fallback: message,
          color,
          title,
          text: message,
        }],
      });
    } catch (error) {
      console.error(`Message not successfully sent to slack:\n\n${message}`);
      throw error;
    }
  }
}
