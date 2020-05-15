import OktaService, { OktaApplicationResponse } from './OktaService';
import { OktaApplication, OAuthApplication } from '../types';

describe('OktaService', () => {
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
      
      const service = new OktaService({
        token: 'fakeToken',
        org: 'fake-va-org',
      });
      
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
});