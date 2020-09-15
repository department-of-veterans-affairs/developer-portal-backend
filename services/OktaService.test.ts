import OktaService, { OktaApplicationResponse } from './OktaService';
import { OktaApplication, OAuthApplication } from '../types';
import { OKTA_AUTHZ_ENDPOINTS } from '../config/apis';

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
    let createMock, groupMock, updateAuthPolicyMock;

    beforeEach(() => {
      jest.clearAllMocks();
      createMock = jest.spyOn(service.client, 'createApplication').mockResolvedValue(appRes);
      groupMock = jest
        .spyOn(service.client, 'createApplicationGroupAssignment')
        .mockResolvedValue({});

      updateAuthPolicyMock = jest
        .spyOn(service.client, 'updateAuthorizationServerPolicy')
        .mockResolvedValue({});

      jest
        .spyOn(service.client, 'listAuthorizationServerPolicies')
        .mockImplementation((authServerId: string) => {
          const policyObj = {
            id: `${authServerId}-policy`,
            name: 'default',
            conditions: { clients: { include: [] } },
          };
          return {
            policies: [policyObj],
            each: function(cb) {
              return this.policies.forEach(cb);
            },
          };
        });
    });

    it('creates an application in Okta and assigns a group to its id', async () => {
      const application: OktaApplication = {
        owner: {
          apiList: ['health', 'communityCare'],
          organization: 'organization',
          email: 'email',
        },
        toOktaApp: () => ({ name: 'oidc_client' } as OAuthApplication),
      };

      const resp = await service.createApplication(application, 'testgroup');

      expect(createMock).toHaveBeenCalledWith({ name: 'oidc_client' });
      expect(groupMock).toHaveBeenCalledWith(appRes.id, 'testgroup');

      const healthApiEndpoint = OKTA_AUTHZ_ENDPOINTS['health'];
      const healthPolicyId = `${healthApiEndpoint}-policy`;
      expect(updateAuthPolicyMock).toHaveBeenCalledWith(healthApiEndpoint, healthPolicyId, {
        id: healthPolicyId,
        name: 'default',
        conditions: { clients: { include: ['fakeid'] } },
      });

      const communityCareApiEndpoint = OKTA_AUTHZ_ENDPOINTS['communityCare'];
      const communityCarePolicyId = `${communityCareApiEndpoint}-policy`;
      expect(updateAuthPolicyMock).toHaveBeenCalledWith(
        communityCareApiEndpoint,
        communityCarePolicyId,
        {
          id: communityCarePolicyId,
          name: 'default',
          conditions: { clients: { include: ['fakeid'] } },
        },
      );
      // one call for the health endpoint + one call for the communityCare endpoint
      expect(updateAuthPolicyMock).toHaveBeenCalledTimes(2);

      expect(resp).toEqual(appRes);
    });

    describe('invalid input', () => {
      it('ignores kong (key based) endpoint and only calls okta endpoint', async () => {
        const application: OktaApplication = {
          owner: {
            apiList: ['health', 'facilities'],
            organization: 'organization',
            email: 'email',
          },
          toOktaApp: () => ({ name: 'oidc_client' } as OAuthApplication),
        };

        const resp = await service.createApplication(application, 'testgroup');

        expect(createMock).toHaveBeenCalledWith({ name: 'oidc_client' });
        expect(groupMock).toHaveBeenCalledWith(appRes.id, 'testgroup');

        const healthApiEndpoint = OKTA_AUTHZ_ENDPOINTS['health'];
        const healthPolicyId = `${healthApiEndpoint}-policy`;
        expect(updateAuthPolicyMock).toHaveBeenCalledWith(healthApiEndpoint, healthPolicyId, {
          id: healthPolicyId,
          name: 'default',
          conditions: { clients: { include: ['fakeid'] } },
        });
        // only called for the health endpoint
        expect(updateAuthPolicyMock).toHaveBeenCalledTimes(1);

        expect(resp).toEqual(appRes);
      });

      it('ignores other invalid endpoints and only calls okta endpoint', async () => {
        const application: OktaApplication = {
          owner: {
            apiList: ['health', 'invalid'],
            organization: 'organization',
            email: 'email',
          },
          toOktaApp: () => ({ name: 'oidc_client' } as OAuthApplication),
        };

        const resp = await service.createApplication(application, 'testgroup');

        expect(createMock).toHaveBeenCalledWith({ name: 'oidc_client' });
        expect(groupMock).toHaveBeenCalledWith(appRes.id, 'testgroup');

        const healthApiEndpoint = OKTA_AUTHZ_ENDPOINTS['health'];
        const healthPolicyId = `${healthApiEndpoint}-policy`;
        expect(updateAuthPolicyMock).toHaveBeenCalledWith(healthApiEndpoint, healthPolicyId, {
          id: healthPolicyId,
          name: 'default',
          conditions: { clients: { include: ['fakeid'] } },
        });
        // only called for the health endpoint
        expect(updateAuthPolicyMock).toHaveBeenCalledTimes(1);

        expect(resp).toEqual(appRes);
      });
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
