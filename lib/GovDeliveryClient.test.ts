import 'jest';
import { GovDeliveryClient } from './GovDeliveryClient';
import { User } from './models';
import * as request from 'request-promise-native';
jest.mock('request-promise-native', () => {
  return {
    post: jest.fn((options) => Promise.resolve({}))
  }
});

describe("KongClient", () => {
  let client;
  let event;
  let user;

  beforeEach(() => {
    client = new GovDeliveryClient({
      token: 'fakeKey',
      host: 'tms.govdelivery.com',
    });
    event = {
      apis: 'facilities,benefits',
      description: 'Mayhem',
      email: 'ed@adhocteam.us',
      firstName: 'Edward',
      lastName: 'Paget',
      organization: 'Ad Hoc',
      termsOfService: true,
    }
    user = new User(event);
    user.token = 'fakeKey'
    request.post.mockReset();
  });

  describe('constructor', () => {
    test('it should render the handlebars template', async () => {
      const template = await client.welcomeTemplate;
      const html = template({
        apis: 'VA Facilities API',
        firstName: 'Edward',
        key: 'fakeKey',
        token_issued: true,
        oauth: false,
      });
      expect(html).toEqual(expect.stringContaining('Welcome Edward'));
      expect(html).toEqual(expect.stringContaining('VA Facilities API'));
      expect(html).toEqual(expect.stringContaining('apiKey: fakeKey'));
    });

    test('it should render the handlebars template with health and verification', async () => {
      const template = await client.welcomeTemplate;
      const html = template({
        apis: 'Health API, Veteran Verification API, and VA Facilities API',
        firstName: 'Edward',
        key: 'fakeKey',
        token_issued: true,
        oauth: true,
        clientID: 'superid',
        clientSecret: 'supersecret',
      });
      expect(html).toEqual(expect.stringContaining('Health API'));
      expect(html).toEqual(expect.stringContaining('Verification'));
      expect(html).toEqual(expect.stringContaining('superid'));
      expect(html).toEqual(expect.stringContaining('supersecret'));
    });

    test('it should hide secret text when not applicable', async () => {
      const template = await client.welcomeTemplate;
      const html = template({
        apis: 'Health API',
        clientID: 'superid',
        firstName: 'Edward',
        oauth: true,
      });
      expect(html).not.toEqual(expect.stringContaining('OAuth Client Secret'));
    });
  });

  describe('sendWelcomeEmail', () => {
    test('it should sent a request', async () => {
      await client.sendWelcomeEmail(user)
      expect(request.post).toHaveBeenCalledWith({
        url: 'https://tms.govdelivery.com/messages/email',
        body: expect.objectContaining({
          recipients: expect.arrayContaining([expect.objectContaining({
            email: 'ed@adhocteam.us'
          })]),
          subject: 'Welcome to the VA API Platform',
          body: expect.stringContaining('VA Facilities API and Benefits Intake API'),
        }),
        json: true,
        headers: { 'X-AUTH-TOKEN': 'fakeKey' }
      });
    });

    test('it should raise error if user lacks token', async () => {
      user.token = undefined;
      expect(client.sendWelcomeEmail(user)).rejects.toEqual(new Error('User must have token or client_id initialized'));
    });
  });
});

