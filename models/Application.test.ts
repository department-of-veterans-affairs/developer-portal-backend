import 'jest';
import Application from './Application';
import OktaService from '../services/OktaService';

describe('Application', () => {
  let applicationSettings;

  beforeEach(() => {
    applicationSettings = {
      name: 'application-name',
      redirectURIs: ['http://developer.va.gov/'],
    };
  });

  describe('applicationType fields', () => {
    it('assigns web fields when applicationType is undefined', () => {
      const application = new Application(applicationSettings);

      const oauthClient = application.toOktaApp().settings.oauthClient;

      expect(oauthClient.application_type).toEqual('web');
      expect(oauthClient.response_types.sort()).toEqual(['code', 'id_token', 'token']);
      expect(oauthClient.grant_types.sort()).toEqual(['authorization_code', 'implicit', 'refresh_token']);
    });

    it('be web fields when applicationType is web', () => {
      const application = new Application({ ...applicationSettings, applicationType: 'web' });

      const oauthClient = application.toOktaApp().settings.oauthClient;

      expect(oauthClient.application_type).toEqual('web');
      expect(oauthClient.response_types.sort()).toEqual(['code', 'id_token', 'token']);
      expect(oauthClient.grant_types.sort()).toEqual(['authorization_code', 'implicit', 'refresh_token']);
    });

    it('be native fields when applicationType is native', () => {
      const application = new Application({ ...applicationSettings, applicationType: 'native' });

      const oauthClient = application.toOktaApp().settings.oauthClient;

      expect(oauthClient.application_type).toEqual('native');
      expect(oauthClient.response_types.sort()).toEqual(['code']);
      expect(oauthClient.grant_types.sort()).toEqual(['authorization_code', 'refresh_token']);
    });
  });

  describe('createOktaApplication', () => {
    const appRes = {
      id: '99hobbitses',
      credentials: {
        oauthClient: {
          client_id: 'hobbit98',
          client_secret: 'had3breakfasts',
        },
      },
      settings: {
        oauthClient: {
          redirect_uris: ['http://locahost:3000'],
        },
      },
    };
    const mockCreateApplication = jest.fn().mockResolvedValue(appRes);

    const mockOkta = {
      createApplication: mockCreateApplication,
    } as unknown as OktaService;

    it('assigns a client_id, client_secret, and oktaID', async () => {
      const application = new Application({ ... applicationSettings, applicationType: 'web' });

      const result = await application.createOktaApplication(mockOkta);

      expect(mockCreateApplication).toHaveBeenCalled();
      expect(application.client_id).toEqual('hobbit98');
      expect(application.client_secret).toEqual('had3breakfasts');
      expect(application.oktaID).toEqual('99hobbitses');
      expect(result).toEqual(appRes);
    });
  });
});
