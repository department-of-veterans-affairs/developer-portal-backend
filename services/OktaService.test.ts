import OktaService, { OktaApplicationResponse } from './OktaService';
import { OktaApplication, OAuthApplication } from '../types';

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
        owner: { apiList: ['health','verification'], organization: 'organization', email: 'email' },
        toOktaApp: () => ({ name: 'oidc_client' } as OAuthApplication),
      };

      const resp = await service.createApplication(application, 'testgroup');

      expect(createMock).toHaveBeenCalledWith({name: 'oidc_client'});
      expect(groupMock).toHaveBeenCalledWith(appRes.id, 'testgroup');
      expect(policyIncludeMock).toHaveBeenCalledWith("fakeid");

      const healthApiEndpoint = 'aus7y0ho1w0bSNLDV2p7';
      expect(updateAuthPolicyMock).toHaveBeenCalledWith(healthApiEndpoint, 'policy_id', policyObj);

      const verificationApiEndpoint = 'aus7y0sefudDrg2HI2p7';
      expect(updateAuthPolicyMock).toHaveBeenCalledWith(verificationApiEndpoint, 'policy_id', policyObj);

      expect(resp).toEqual(appRes);
    });
  });

  xdescribe('it knows the list of applicable authz endpoints', () => {
    describe('valid inputs', () => {
      it('health', () => {
        expect(service.filterApplicableEndpoints(['health'])).toEqual(['aus7y0ho1w0bSNLDV2p7']);
      });
      it('health,claims', () => {
        expect(service.filterApplicableEndpoints(['health','claims'])).toEqual(['aus7y0ho1w0bSNLDV2p7', 'aus7y0lyttrObgW622p7']);
      });
      it('health,communityCare,verification,claims', () => {
        expect(service.filterApplicableEndpoints(['health', 'communityCare','verification','claims'])).toEqual(['aus7y0ho1w0bSNLDV2p7', 'aus89xnh1xznM13SK2p7', 'aus7y0sefudDrg2HI2p7', 'aus7y0lyttrObgW622p7']);
      });
    });

    describe('ignores invalid input', () => {
      it('health,invalid', () => {
        expect(service.filterApplicableEndpoints(['health', 'invalid'])).toEqual(["aus7y0ho1w0bSNLDV2p7"]);
      });
      it('invalid', () => {
        expect(service.filterApplicableEndpoints(['invalid'])).toEqual([]);
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
