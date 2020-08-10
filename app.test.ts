import 'jest';
import supertest from 'supertest';
import nock from 'nock';

//set server environment variables before the app is loaded
process.env.KONG_KEY = 'fake-kong-key';
process.env.KONG_HOST = 'fake-kong-host';
process.env.GOVDELIVERY_HOST = 'fake-gov-delivery-host';
process.env.GOVDELIVERY_KEY = 'fake-gov-delivery-key';
process.env.SUPPORT_EMAIL = 'support@theshire.net';
process.env.OKTA_TOKEN = 'fake-token';
process.env.OKTA_ORG = 'the-shire-org';
process.env.DYNAMODB_ENDPOINT = 'http://dynamodb';
process.env.DYNAMODB_ACCESS_KEY_ID = 'NONE';
process.env.DYNAMODB_REGION = 'us-west-2';
process.env.DYNAMODB_ACCESS_KEY_SECRET = 'NONE';
process.env.DYNAMODB_SESSION_TOKEN = 'fake-dynamo-db-session-token';
process.env.SLACK_WEBHOOK = 'http://shire-web-hook';
process.env.SLACK_CHANNEL = 'fake-slack-channel';

import configureApp from './app';

const request = supertest(configureApp());
describe('App routing', () => {
  describe('/health', () => {
    it('succeeds on healthcheck', async () => {
      const response = await request.get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('up');
    });
  });

  describe('/developer_application', () => {
    it('sends a 400 response and descriptive errors if validations fail', async () => {
      const response = await request.post('/developer_application').send({
        apis: 'benefits',
        email: 'eowyn@rohan.horse',
        lastName: 'Eorl',
        termsOfService: true,
      });

      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        errors: ['"firstName" is required', '"organization" is required'],
      });
    });

    it('sends 200 on successful dev application form submit', async () => {
      nock.disableNetConnect();
      nock.enableNetConnect('127.0.0.1');

      const kong = nock(`http://${process.env.KONG_HOST}:8000`);

      kong.get('/internal/admin/consumers/FellowshipBaggins').reply(200, {
        id: '123', created_at: 1008720000, username: 'frodo', custom_id: '222', tags: null,
      })
        .get('/internal/admin/consumers/FellowshipBaggins/acls').reply(200, {
          total: 2, data: [{ group: 'va_facilities', created_at: 1040169600, id: '123', consumer: { id: '222' } },
          { group: 'veteran_verification', created_at: 1040169600, id: '123', consumer: { id: '222' } }],
        })
        .post('/internal/admin/consumers/FellowshipBaggins/key-auth').reply(200, { key: 'my-precious' });

      const okta = nock(`https://${process.env.OKTA_ORG}.okta.com`);

      okta.post('/api/v1/apps').reply(200, { id: '123', credentials: { oauthClient: { client_id: 'gollum', client_secret: 'mordor' } } })
        .put(`/api/v1/apps/123/groups/00g1syt19eSr12rXz2p7`)
        .reply(200, { client_id: 'gollum', client_secret: 'mordor' });

      const dynamoDB = nock(`${process.env.DYNAMODB_ENDPOINT}`, {
        filteringScope: scope => /^http:\/\/dynamodb*/.test(scope),
      }).filteringPath(() => "/");

      dynamoDB.post('/').reply(200);

      const govDelivery = nock('https://fake-gov-delivery-host');

      govDelivery.post('/messages/email')
        .reply(200, { from_name: 'Samwise', from_email: 'samwise@thefellowship.org' });

      const slack = nock(process.env.SLACK_WEBHOOK);

      slack.post('/').reply(200);

      const devAppRequest = {
        apis: 'facilities,verification',
        description: 'save the world',
        email: 'frodo@fellowship.org',
        firstName: 'Frodo',
        lastName: 'Baggins',
        organization: 'Fellowship',
        termsOfService: true,
        oAuthRedirectURI: 'https://fake-oAuth-redirect-uri',
        oAuthApplicationType: 'web',
      };

      const response = await request.post('/developer_application').send(devAppRequest);

      nock.cleanAll();
      nock.enableNetConnect();

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        clientID: 'gollum',
        clientSecret: 'mordor',
        token: 'my-precious',
      });
    });

    it('sends 500 and error message ', async () => {
      const kong = nock(`http://${process.env.KONG_HOST}:8000`);

      kong.get('/internal/admin/consumers/FellowshipBaggins').reply(500);

      const devAppRequest = {
        apis: 'facilities,verification',
        description: 'save the world',
        email: 'frodo@fellowship.org',
        firstName: 'Frodo',
        lastName: 'Baggins',
        organization: 'Fellowship',
        termsOfService: true,
        oAuthRedirectURI: 'https://fake-oAuth-redirect-uri',
        oAuthApplicationType: 'web',
      };

      const response = await request.post('/developer_application').send(devAppRequest);

      expect(response.status).toEqual(500);
      expect(response.text).toContain('failed creating kong consumer');
    });
  });

  describe('/contact-us', () => {

    const govDelivery = nock('https://fake-gov-delivery-host');

    it('sends a 400 response and descriptive errors if validations fail', async () => {
      const response = await request.post('/contact-us').send({
        email: 'samwise@thefellowship.org',
        description: 'Need help getting to Mt. Doom',
      });

      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        errors: ['"firstName" is required', '"lastName" is required'],
      });
    });

    it('sends 200 on submit of Contact Us form and sends email from GovDelivery', async () => {

      const supportReq = {
        firstName: 'Samwise',
        lastName: 'Gamgee',
        email: 'samwise@thefellowship.org',
        organization: 'The Fellowship of the Ring',
        description: 'Need help getting to Mt. Doom',
        apis: ['benefits', 'facilities'],
      };

      govDelivery
        .post('/messages/email')
        .reply(200, { from_name: 'Samwise', from_email: 'samwise@thefellowship.org' });

      const response = await request.post('/contact-us').send(supportReq);

      expect(response.status).toEqual(200);
    });

    it('sends error message on 500 status eee', async () => {

      const supportReq = {
        firstName: 'Samwise',
        lastName: 'Gamgee',
        email: 'samwise@thefellowship.org',
        organization: 'The Fellowship of the Ring',
        description: 'Need help getting to Mt. Doom',
        apis: ['benefits', 'facilities'],
      };

      govDelivery
        .post('/messages/email')
        .reply(500);

      const response = await request.post('/contact-us').send(supportReq);

      expect(response.status).toEqual(500);
      expect(response.text).toContain('sending contact us email');
    });
  });
});

describe('/reports/signups', () => {
  it('sends a 400 response and descriptive errors if validations fail', async () => {
    const response = await request.get('/reports/signups?span=Gimli');

    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      errors: ['"span" must be one of [week, month]'],
    });
  });
});
