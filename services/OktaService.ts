import { Client, DefaultRequestExecutor } from '@okta/okta-sdk-nodejs';
import { OktaApplication } from '../types';

class OktaService {
  public client: Client;

  constructor({ org, token }) {
    this.client = new Client({
      token,
      orgUrl: `https://${org}.okta.com`,
      requestExecutor: new DefaultRequestExecutor(),
    });
  }

  public async createApplication(app: OktaApplication, groupID: string) {
    const resp = await this.client.createApplication(app.toOktaApp());
    await this.client.createApplicationGroupAssignment(resp.id, groupID);
    return resp;
  }
}

export default OktaService;