import OktaService, { OktaApplicationResponse } from './OktaService';
import { OktaApplication, OAuthApplication } from '../types';
import { KONG_CONSUMER_APIS, OKTA_CONSUMER_APIS } from '../config/apis';

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
    let createMock, groupMock, policyIncludeMock, policyObj, updateAuthPolicyMock;

    beforeEach(() => {
      jest.clearAllMocks();
      createMock = jest.spyOn(service.client, 'createApplication').mockResolvedValue(appRes);
      groupMock = jest.spyOn(service.client, 'createApplicationGroupAssignment').mockResolvedValue({});

      policyIncludeMock = jest.fn();
      policyObj = {id: 'policy_id', conditions: {clients: {include: {push: policyIncludeMock}}}};
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
      expect(policyIncludeMock).toHaveBeenCalledWith("fakeid");

      const healthApiEndpoint = 'aus7y0ho1w0bSNLDV2p7';
      expect(updateAuthPolicyMock).toHaveBeenCalledWith(healthApiEndpoint, 'policy_id', policyObj);

      const communityCareApiEndpoint = 'aus89xnh1xznM13SK2p7';
      expect(updateAuthPolicyMock).toHaveBeenCalledWith(communityCareApiEndpoint, 'policy_id', policyObj);

      const verificationApiEndpoint = 'aus7y0sefudDrg2HI2p7';
      expect(updateAuthPolicyMock).toHaveBeenCalledWith(verificationApiEndpoint, 'policy_id', policyObj);

      const claimsApiEndpoint = 'aus7y0lyttrObgW622p7';
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
      expect(policyIncludeMock).toHaveBeenCalledWith("fakeid");

      const healthApiEndpoint = 'aus7y0ho1w0bSNLDV2p7';
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
