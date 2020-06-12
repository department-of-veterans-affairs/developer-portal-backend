import { Client, DefaultRequestExecutor } from '@okta/okta-sdk-nodejs';
import { OktaApplication } from '../types';
import { ServiceHealthCheckResponse } from '../models/HealthCheck';

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

  // Okta is considered healthy if it is able to return the user making requests to the client
  public async healthCheck(): Promise<ServiceHealthCheckResponse> {
    try {
      const user = await this.client.getUser('me');
      if (user.constructor.name !== 'User') {
        throw new Error(`Okta did not return a user: ${JSON.stringify(user)}`);
      }
      return {
        serviceName: 'Okta',
        healthy: true,
      };
    } catch (err) {
      err.action = 'checking health of Okta';
      return {
        serviceName: 'Okta',
        healthy: false,
        err: err
      };
    }
  }
}