import { Client, DefaultRequestExecutor } from '@okta/okta-sdk-nodejs';
import { MonitoredService, OktaApplication, ServiceHealthCheckResponse } from '../types';
import { OKTA_AUTHZ_END_POINTS } from '../config/apis';


function filterApplicableEndpoints(apiList: string[]): string[] {
  const filteredApiList: string[] = apiList
    .filter(endpoint => OKTA_AUTHZ_END_POINTS[endpoint])
    .map(endpoint => OKTA_AUTHZ_END_POINTS[endpoint]);
  return [...new Set(filteredApiList)];
}
export interface OktaApplicationResponse {
  id: string;
  credentials: {
    oauthClient: {
      client_id: string;
      client_secret?: string;
    };
  };
}
export default class OktaService implements MonitoredService {
  public client: Client;

  constructor({ host, token }) {
    this.client = new Client({
      token,
      orgUrl: host,
      requestExecutor: new DefaultRequestExecutor(),
    });
  }

  public async createApplication(app: OktaApplication, groupID: string): Promise<OktaApplicationResponse> {
    const resp = await this.client.createApplication(app.toOktaApp());
    await this.client.createApplicationGroupAssignment(resp.id, groupID);

    const applicableEndpoints = filterApplicableEndpoints(app.owner.apiList);

    const policiesToUpdate: Array<Promise<void>> = [];

    await Promise.all(applicableEndpoints.map(async (authServerId) => {
      const policies = await this.client.listAuthorizationServerPolicies(authServerId);
      const clientId = resp.credentials.oauthClient.client_id;

      policies.each(policy => {
        policy.conditions.clients.include.push(clientId);
        policiesToUpdate.push(this.client.updateAuthorizationServerPolicy(authServerId, policy.id, policy));
      });
    }));

    Promise.all(policiesToUpdate);

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
        err: err,
      };
    }
  }

}
