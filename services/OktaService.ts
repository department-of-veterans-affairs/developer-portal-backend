 import { Client, DefaultRequestExecutor } from '@okta/okta-sdk-nodejs';
import { OktaApplication } from '../types';

export interface OktaApplicationResponse {
  id: string;
  credentials: {
    oauthClient: {
      client_id: string;
      client_secret?: string;
    };
  };
}
export default class OktaService {
  public client: Client;

  constructor({ org, token }) {
    this.client = new Client({
      token,
      orgUrl: `https://${org}.okta.com`,
      requestExecutor: new DefaultRequestExecutor(),
    });
  }

  public async createApplication(app: OktaApplication, groupID: string): Promise<OktaApplicationResponse> {
    const resp = await this.client.createApplication(app.toOktaApp());
    await this.client.createApplicationGroupAssignment(resp.id, groupID);
    return resp;
  }
}