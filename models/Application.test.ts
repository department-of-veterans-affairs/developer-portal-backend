import 'jest';
import { Application } from './Application';

describe('User', () => {
    let applicationSettings;

    beforeEach(() => {
        applicationSettings = {
            name: 'application-name',
            redirectURIs: ['http://developer.va.gov/']
        };
    });

    describe('applicationType fields', () => {
        test('it should assign web fields when applicationType is undefined', () => {
            const application = new Application(applicationSettings);
            expect(application.toOktaApp().settings.oauthClient.application_type).toEqual('web');
            expect(application.toOktaApp().settings.oauthClient.response_types.sort()).toEqual(['code', 'id_token', 'token']);
            expect(application.toOktaApp().settings.oauthClient.grant_types.sort()).toEqual(['authorization_code', 'implicit', 'refresh_token']);
        });

        test('it should be web fields when applicationType is web', () => {
            const application = new Application({...applicationSettings, applicationType: 'web'});
            expect(application.toOktaApp().settings.oauthClient.application_type).toEqual('web');
            expect(application.toOktaApp().settings.oauthClient.response_types.sort()).toEqual(['code', 'id_token', 'token']);
            expect(application.toOktaApp().settings.oauthClient.grant_types.sort()).toEqual(['authorization_code', 'implicit', 'refresh_token']);
        });

        test('it should be native fields when applicationType is native', () => {
            const application = new Application({...applicationSettings, applicationType: 'native'});
            expect(application.toOktaApp().settings.oauthClient.application_type).toEqual('native');
            expect(application.toOktaApp().settings.oauthClient.response_types.sort()).toEqual(['code']);
            expect(application.toOktaApp().settings.oauthClient.grant_types.sort()).toEqual(['authorization_code', 'refresh_token']);
        });
    });
});
