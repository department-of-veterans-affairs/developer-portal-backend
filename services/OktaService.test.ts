import OktaService, { OktaApplicationResponse } from './OktaService';
import { OktaApplication, OAuthApplication } from '../types';

describe('OktaService', () => {
  const service: OktaService = new OktaService({
    token: 'fakeToken',
    org: 'fake-va-org',
  });

  describe('createApplication', () => {
    it('creates an application in Okta and assigns a group to its id', async () => {
      const appRes: OktaApplicationResponse = {
        id: '123',
        credentials: {
          oauthClient: {
            client_id: 'fakeid',
            client_secret: 'fakesecret',
          }
        },
      };
      
      const createMock = jest.spyOn(service.client, 'createApplication').mockResolvedValue(appRes);
      const groupMock = jest.spyOn(service.client, 'createApplicationGroupAssignment').mockResolvedValue({});
  
      const application: OktaApplication = {
        toOktaApp: () => ({ name: 'oidc_client' } as OAuthApplication)
      };
  
      const resp = await service.createApplication(application, 'testgroup');
  
      expect(createMock).toHaveBeenCalledWith({name: 'oidc_client'});
      expect(groupMock).toHaveBeenCalledWith(appRes.id, 'testgroup');
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