import logger from '../config/logger';
import { Client, DefaultRequestExecutor } from '@okta/okta-sdk-nodejs';
import { MonitoredService, OktaApplication, ServiceHealthCheckResponse } from '../types';
import { OKTA_AUTHZ_ENDPOINTS } from '../config/apis';

function filterApplicableEndpoints(apiList: string[]): string[] {
  const filteredApiList: string[] = apiList
    .filter(endpoint => OKTA_AUTHZ_ENDPOINTS[endpoint])
    .map(endpoint => OKTA_AUTHZ_ENDPOINTS[endpoint]);
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

    await Promise.all(applicableEndpoints.map(async (authServerId) => {
      const policies = await this.client.listAuthorizationServerPolicies(authServerId);
      const clientId = resp.credentials.oauthClient.client_id;
      let defaultPolicy;

      policies.each(policy => {
        if (policy['name'] === 'default') {
          defaultPolicy = policy;
          return false;
        }
      });
      if (defaultPolicy) {
        defaultPolicy.conditions.clients.include.push(clientId);
        await this.client.updateAuthorizationServerPolicy(authServerId, defaultPolicy.id, defaultPolicy);
      } else {
        // What should happen if this fails to find a default policy?
        logger.error(`Failed to find default policy for OktaApplication: ${app} and authServerId: ${authServerId}`);
      }

    }));

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
