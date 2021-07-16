import OktaService from './OktaService';
import { OktaApplication } from '../types';
import {
  OAuthApplication,
  OktaApplicationResponse,
  OktaPolicy,
  OktaPolicyCollection,
} from '@okta/okta-sdk-nodejs';
import { OKTA_AUTHZ_ENDPOINTS } from '../config/apis';

const scaffoldOktaPolicy = (id: string, name: string): OktaPolicy => ({
  type: 'test',
  id,
  status: 'test',
  name,
  description: 'test',
  priority: 1,
  system: true,
  conditions: {
    clients: {
      include: [],
    },
  },
});

const createOktaPolicyCollection = (...policies: OktaPolicy[]): OktaPolicyCollection => {
  const each = (iterator: (obj: OktaPolicy) => void | boolean): Promise<void> => {
    policies.forEach(iterator);
    return Promise.resolve();
  };

  return {
    each,
  };
};

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
        .mockResolvedValue(Promise.resolve());

      updateAuthPolicyMock = jest
        .spyOn(service.client, 'updateAuthorizationServerPolicy')
        .mockResolvedValue(Promise.resolve());

      // The policy with name === 'default' is the only one that we update
      const spyListAuthServerPolicies = jest.spyOn(
        service.client,
        'listAuthorizationServerPolicies',
      ) as jest.SpyInstance<Promise<OktaPolicyCollection>, string[]>;
      spyListAuthServerPolicies.mockImplementation((authServerId: string) => {
        const policy1 = scaffoldOktaPolicy(`${authServerId}-1-policy`, 'policy1');
        const policy2 = scaffoldOktaPolicy(`${authServerId}-policy`, 'default');
        const policy3 = scaffoldOktaPolicy(`${authServerId}-3-policy`, 'policy3');
        return Promise.resolve(createOktaPolicyCollection(policy1, policy2, policy3));
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

      const healthApiEndpoint = OKTA_AUTHZ_ENDPOINTS.health;
      const healthPolicyId = `${healthApiEndpoint}-policy`;
      expect(updateAuthPolicyMock).toHaveBeenCalledWith(
        healthApiEndpoint,
        healthPolicyId,
        expect.objectContaining({
          id: healthPolicyId,
          name: 'default',
          conditions: { clients: { include: ['fakeid'] } },
        }),
      );

      const communityCareApiEndpoint = OKTA_AUTHZ_ENDPOINTS.communityCare;
      const communityCarePolicyId = `${communityCareApiEndpoint}-policy`;

      // one call for the health endpoint + one call for the communityCare endpoint
      expect(updateAuthPolicyMock).toHaveBeenCalledTimes(2);
      expect(updateAuthPolicyMock).toHaveBeenCalledWith(
        communityCareApiEndpoint,
        communityCarePolicyId,
        expect.objectContaining({
          id: communityCarePolicyId,
          name: 'default',
          conditions: { clients: { include: ['fakeid'] } },
        }),
      );

      expect(resp).toEqual(appRes);
    });

    it('throws error if there is no default policy', async () => {
      // we have to reset the list of policies to not include one with the 'default' name
      const spyListAuthServerPolicies = jest.spyOn(
        service.client,
        'listAuthorizationServerPolicies',
      ) as jest.SpyInstance<Promise<OktaPolicyCollection>, string[]>;
      spyListAuthServerPolicies.mockImplementation((authServerId: string) => {
        const policy1 = scaffoldOktaPolicy(`${authServerId}-1-policy`, 'policy1');
        const policy2 = scaffoldOktaPolicy(`${authServerId}-policy`, 'policy2');
        const policy3 = scaffoldOktaPolicy(`${authServerId}-3-policy`, 'policy3');
        return Promise.resolve(createOktaPolicyCollection(policy1, policy2, policy3));
      });

      const application: OktaApplication = {
        owner: {
          apiList: ['health'],
          organization: 'organization',
          email: 'email',
        },
        toOktaApp: () => ({ name: 'oidc_client' } as OAuthApplication),
      };

      await expect(service.createApplication(application, 'testgroup')).rejects.toThrow();
    });

    describe('ignores non okta endpoints', () => {
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

        const healthApiEndpoint = OKTA_AUTHZ_ENDPOINTS.health;
        const healthPolicyId = `${healthApiEndpoint}-policy`;

        // only called for the health endpoint
        expect(updateAuthPolicyMock).toHaveBeenCalledTimes(1);
        expect(updateAuthPolicyMock).toHaveBeenCalledWith(
          healthApiEndpoint,
          healthPolicyId,
          expect.objectContaining({
            id: healthPolicyId,
            name: 'default',
            conditions: { clients: { include: ['fakeid'] } },
          }),
        );

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

        const healthApiEndpoint = OKTA_AUTHZ_ENDPOINTS.health;
        const healthPolicyId = `${healthApiEndpoint}-policy`;

        // only called for the health endpoint
        expect(updateAuthPolicyMock).toHaveBeenCalledTimes(1);
        expect(updateAuthPolicyMock).toHaveBeenCalledWith(
          healthApiEndpoint,
          healthPolicyId,
          expect.objectContaining({
            id: healthPolicyId,
            name: 'default',
            conditions: { clients: { include: ['fakeid'] } },
          }),
        );

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
