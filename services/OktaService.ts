import logger from '../config/logger';
import {
  Client,
  DefaultRequestExecutor,
  OktaApplicationResponse,
  OktaPolicy,
  OktaPolicyCollection,
} from '@okta/okta-sdk-nodejs';
import { MonitoredService, OktaApplication, ServiceHealthCheckResponse } from '../types';
import { OKTA_AUTHZ_ENDPOINTS } from '../config/apis';
import { DevPortalError } from '../models/DevPortalError';

function filterApplicableEndpoints(apiList: string[]): string[] {
  const filteredApiList: string[] = apiList
    .filter(endpoint => OKTA_AUTHZ_ENDPOINTS[endpoint])
    .map(endpoint => OKTA_AUTHZ_ENDPOINTS[endpoint]);
  return [...new Set(filteredApiList)];
}

export default class OktaService implements MonitoredService {
  public client: Client;

  constructor({ host, token }: { host: string, token: string}) {
    this.client = new Client({
      token,
      orgUrl: host,
      requestExecutor: new DefaultRequestExecutor(),
    });
  }

  private async getDefaultPolicy(policies: OktaPolicyCollection): Promise<OktaPolicy | null> {
    let defaultPolicy: OktaPolicy | null = null;

    // Typescript doesn't seem to understand how this function works
    await policies.each(policy => {
      if (policy.name === 'default') {
        defaultPolicy = policy;
        return false;
      }
    });

    return defaultPolicy;
  }

  public async createApplication(
    app: OktaApplication,
    groupID: string,
  ): Promise<OktaApplicationResponse> {
    const resp = await this.client.createApplication(app.toOktaApp());
    await this.client.createApplicationGroupAssignment(resp.id, groupID);

    const applicableEndpoints = filterApplicableEndpoints(app.owner.apiList);

    await Promise.all(
      applicableEndpoints.map(async authServerId => {
        const policies: OktaPolicyCollection = await this.client.listAuthorizationServerPolicies(authServerId);
        const clientId = resp.credentials.oauthClient.client_id;
        const defaultPolicy: OktaPolicy | null = await this.getDefaultPolicy(policies);

        // policies.each returns a promise https://developer.okta.com/okta-sdk-nodejs/jsdocs/#toc31__anchor
        if (defaultPolicy) {
          defaultPolicy.conditions.clients.include.push(clientId);
          await this.client.updateAuthorizationServerPolicy(
            authServerId,
            defaultPolicy.id,
            defaultPolicy,
          );
        } else {
          logger.error({message: "No default policy", clientId: clientId, authServerId: authServerId});
          throw new Error(`No default policy for clientId: ${clientId}, authServerId: ${authServerId}`);
        }
      }),
    );

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
    } catch (err: unknown) {
      (err as DevPortalError).action = 'checking health of Okta';
      return {
        serviceName: 'Okta',
        healthy: false,
        err: err as DevPortalError,
      };
    }
  }
}
