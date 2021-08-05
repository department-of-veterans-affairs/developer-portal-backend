import {
  Client,
  DefaultRequestExecutor,
  OktaApplicationResponse,
  OktaPolicy,
  OktaPolicyCollection,
} from '@okta/okta-sdk-nodejs';
import logger from '../config/logger';
import { MonitoredService, OktaApplication, ServiceHealthCheckResponse } from '../types';
import { OKTA_AUTHZ_ENDPOINTS } from '../config/apis';
import { DevPortalError } from '../models/DevPortalError';

const filterApplicableEndpoints = (apiList: string[]): string[] => {
  const filteredApiList: string[] = apiList
    .filter(endpoint => OKTA_AUTHZ_ENDPOINTS[endpoint])
    .map(endpoint => OKTA_AUTHZ_ENDPOINTS[endpoint]);
  return [...new Set(filteredApiList)];
};

export default class OktaService implements MonitoredService {
  public client: Client;

  public constructor({ host, token }: { host: string; token: string }) {
    this.client = new Client({
      orgUrl: host,
      requestExecutor: new DefaultRequestExecutor(),
      token,
    });
  }

  private static async getDefaultPolicy(
    policies: OktaPolicyCollection,
  ): Promise<OktaPolicy | null> {
    let defaultPolicy: OktaPolicy | null = null;

    await policies.each((policy): false | undefined => {
      if (policy.name === 'default') {
        defaultPolicy = policy;
        return false;
      }

      return undefined;
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
        const policies: OktaPolicyCollection = await this.client.listAuthorizationServerPolicies(
          authServerId,
        );
        const clientId = resp.credentials.oauthClient.client_id;
        const defaultPolicy: OktaPolicy | null = await OktaService.getDefaultPolicy(policies);

        if (defaultPolicy) {
          defaultPolicy.conditions.clients.include.push(clientId);
          await this.client.updateAuthorizationServerPolicy(
            authServerId,
            defaultPolicy.id,
            defaultPolicy,
          );
        } else {
          logger.error({
            authServerId,
            clientId,
            message: 'No default policy',
          });
          throw new Error(
            `No default policy for clientId: ${clientId}, authServerId: ${authServerId}`,
          );
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
        healthy: true,
        serviceName: 'Okta',
      };
    } catch (err: unknown) {
      (err as DevPortalError).action = 'checking health of Okta';
      return {
        err: err as DevPortalError,
        healthy: false,
        serviceName: 'Okta',
      };
    }
  }
}
