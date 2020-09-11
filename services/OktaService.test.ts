import OktaService, { OktaApplicationResponse } from './OktaService';
import { OktaApplication, OAuthApplication } from '../types';
import { KONG_CONSUMER_APIS, OKTA_CONSUMER_APIS, OKTA_AUTHZ_ENDPOINTS } from '../config/apis';

describe('OktaService', () => {
  const service: OktaService = new OktaService({
    token: 'fakeToken',
    host: 'https://fake-va-org.okta.com',
  });

  describe('createApplication', () => {
    const appRes: OktaApplicationResponse = {
      id: '123',
      credentials: {
        oauthClient: {
          client_id: 'fakeid',
          client_secret: 'fakesecret',
        },
      },
    };
    let createMock, groupMock, policyIncludeArray, policyObj, updateAuthPolicyMock;

    beforeEach(() => {
      jest.clearAllMocks();
      createMock = jest.spyOn(service.client, 'createApplication').mockResolvedValue(appRes);
      groupMock = jest.spyOn(service.client, 'createApplicationGroupAssignment').mockResolvedValue({});

      policyIncludeArray = [];
      policyObj = {id: 'policy_id', conditions: {clients: {include: policyIncludeArray}}};
      jest.spyOn(service.client, 'listAuthorizationServerPolicies').mockResolvedValue({
        policies: [policyObj],
        each: function(cb) { return this.policies.forEach(cb); },
      });

      updateAuthPolicyMock = jest.spyOn(service.client, 'updateAuthorizationServerPolicy').mockResolvedValue({});
    });

    it('creates an application in Okta and assigns a group to its id', async () => {
      const application: OktaApplication = {
        owner: { apiList: ['health','communityCare','verification','claims'], organization: 'organization', email: 'email' },
        toOktaApp: () => ({ name: 'oidc_client' } as OAuthApplication),
      };

      const resp = await service.createApplication(application, 'testgroup');

      expect(createMock).toHaveBeenCalledWith({name: 'oidc_client'});
      expect(groupMock).toHaveBeenCalledWith(appRes.id, 'testgroup');
      // one fakeid for each call
      expect(policyIncludeArray).toEqual(['fakeid', 'fakeid', 'fakeid', 'fakeid']);

      const healthApiEndpoint = OKTA_AUTHZ_ENDPOINTS['health'];
      expect(updateAuthPolicyMock).toHaveBeenCalledWith(healthApiEndpoint, 'policy_id', policyObj);

      const communityCareApiEndpoint = OKTA_AUTHZ_ENDPOINTS['communityCare'];
      expect(updateAuthPolicyMock).toHaveBeenCalledWith(communityCareApiEndpoint, 'policy_id', policyObj);

      const verificationApiEndpoint = OKTA_AUTHZ_ENDPOINTS['verification'];
      expect(updateAuthPolicyMock).toHaveBeenCalledWith(verificationApiEndpoint, 'policy_id', policyObj);

      const claimsApiEndpoint = OKTA_AUTHZ_ENDPOINTS['claims'];
      expect(updateAuthPolicyMock).toHaveBeenCalledWith(claimsApiEndpoint, 'policy_id', policyObj);

      expect(resp).toEqual(appRes);
    });

    it('non okta endpoints input are a NOOP', async () => {
      const facilitiesEndpoint = KONG_CONSUMER_APIS.find(x => x = "facilities");
      const healthEndpoint = OKTA_CONSUMER_APIS.find(x => x = "health");
      const invaldEndpoint = "invalidEndpoint";

      const application: OktaApplication = {
        owner: { apiList: [healthEndpoint,facilitiesEndpoint,invaldEndpoint], organization: 'organization', email: 'email' },
        toOktaApp: () => ({ name: 'oidc_client' } as OAuthApplication),
      };

      const resp = await service.createApplication(application, 'testgroup');

      expect(createMock).toHaveBeenCalledWith({name: 'oidc_client'});
      expect(groupMock).toHaveBeenCalledWith(appRes.id, 'testgroup');
      expect(policyIncludeArray).toEqual(["fakeid"]);

      const healthApiEndpoint = OKTA_AUTHZ_ENDPOINTS['health'];
      expect(updateAuthPolicyMock.mock.calls).toEqual([[healthApiEndpoint, 'policy_id', policyObj]]);

      expect(resp).toEqual(appRes);
    });
  });

  describe('healthCheck', () => {
    const getUserMock: jest.SpyInstance = jest.spyOn(service.client, 'getUser');

    beforeEach(() => {
      getUserMock.mockClear();
    });

    it('sends a request', async () => {
      await service.healthCheck();
      expect(getUserMock).toHaveBeenCalledWith('me');
    });

    it('returns unhealthy when it catches an error', async () => {
      const err = new Error('Invalid token provided');
      const expectedReturn = { serviceName: 'Okta', healthy: false, err: err };
      getUserMock.mockRejectedValue(err);

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toStrictEqual(expectedReturn);
    });

    it('returns unhealthy when it receives anything but a User object from Okta', async () => {
      const mockValue = { constructor: { name: 'Orc' } };
      const err = new Error(`Okta did not return a user: ${JSON.stringify(mockValue)}`);
      const expectedReturn = { serviceName: 'Okta', healthy: false, err: err };
      getUserMock.mockResolvedValue(mockValue);

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toStrictEqual(expectedReturn);
    });

    it('returns healthy when it receives a User object from Okta', async () => {
      const expectedReturn = { serviceName: 'Okta', healthy: true };
      getUserMock.mockResolvedValue({ constructor: { name: 'User' } });

      const resp = await service.healthCheck();
      expect(resp).toStrictEqual(expectedReturn);
    });
  });
});
