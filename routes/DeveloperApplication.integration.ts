import 'jest';
import supertest from 'supertest';
import nock from 'nock';

import configureApp from '../app';
import { IDME_GROUP_ID } from '../models/Application';
import { oktaAuthMocks } from '../types/mocks';
import { OKTA_AUTHZ_ENDPOINTS } from '../config/apis';

const request = supertest(configureApp());
const route = '/internal/developer-portal/public/developer_application';
describe(route, () => {
  if (!process.env.KONG_HOST) {
    throw new Error(
      'Environment variable KONG_HOST must be defined for DeveloperApplication.integration test'
    );
  }
  if (!process.env.DYNAMODB_ENDPOINT) {
    throw new Error(
      'Environment variable DYNAMODB_ENDPOINT must be defined for DeveloperApplication.integration test'
    );
  }
  if (!process.env.GOVDELIVERY_HOST) {
    throw new Error(
      'Environment variable GOVDELIVERY_HOST must be defined for DeveloperApplication.integration test'
    );
  }
  if (!process.env.OKTA_HOST) {
    throw new Error(
      'Environment variable OKTA_HOST must be defined for DeveloperApplication.integration test'
    );
  }
  if (!process.env.SLACK_BASE_URL) {
    throw new Error(
      'Environment variable SLACK_BASE_URL must be defined for DeveloperApplication.integration test'
    );
  }

  const kong = nock(`http://${process.env.KONG_HOST}:8000`);
  const okta = nock(process.env.OKTA_HOST);
  const dynamoDB = nock(process.env.DYNAMODB_ENDPOINT);
  const govDelivery = nock(`https://${process.env.GOVDELIVERY_HOST}`);
  const slack = nock(process.env.SLACK_BASE_URL);

  const baseAppRequest = {
    description: 'save the world',
    email: 'frodo@fellowship.org',
    firstName: 'Frodo',
    lastName: 'Baggins',
    organization: 'Fellowship',
    termsOfService: true,
  };

  const devAppRequest = {
    ...baseAppRequest,
    apis: 'facilities,verification',
    oAuthRedirectURI: 'https://fake-oAuth-redirect-uri',
    oAuthApplicationType: 'web',
  };

  beforeEach(() => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');

    kong.get('/internal/admin/consumers/FellowshipBaggins').reply(404)
      .get('/internal/admin/consumers/FellowshipBaggins/acls').reply(404)
      .post('/internal/admin/consumers/FellowshipBaggins/acls', { group: 'va_facilities'}).reply(201,
        { group: 'facilities', created_at: 1040169600, id: '123', consumer: { id: '222' } },
      )
      .post('/internal/admin/consumers/FellowshipBaggins/acls', { group: 'veteran_verification'}).reply(201,
        { group: 'veteran_verification', created_at: 1040169600, id: '123', consumer: { id: '222' } },
      )
      .post('/internal/admin/consumers', { username: 'FellowshipBaggins' }).reply(201, { id: '123', created_at: 1008720000, username: 'frodo', custom_id: '222', tags: null })
      .post('/internal/admin/consumers/FellowshipBaggins/key-auth').reply(201, { key: 'my-precious' });

    okta.post('/api/v1/apps').reply(200, { id: '123', credentials: { oauthClient: { client_id: 'gollum', client_secret: 'mordor' } } })
      .put(`/api/v1/apps/123/groups/${IDME_GROUP_ID}`).reply(200, {});

    const { oktaPolicyCollection, oktaPolicy } = oktaAuthMocks;
    const verificationApiEndpoint = OKTA_AUTHZ_ENDPOINTS.verification;
    okta
      .get(`/api/v1/authorizationServers/${verificationApiEndpoint}/policies`).reply(200, oktaPolicyCollection)
      .put(`/api/v1/authorizationServers/${verificationApiEndpoint}/policies/defaultPolicyIdHere`).reply(200, oktaPolicy);

    dynamoDB.post('/').reply(200);

    govDelivery.post('/messages/email').reply(200);

    slack.post('/api/chat.postMessage').reply(200);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('sends a 400 response and descriptive errors if validations fail', async () => {
    const response = await request.post(route).send({
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

  describe('200 success', () => {
    it('succeeds for a request with only key auth api', async () => {
      const response = await request.post(route).send({
        ...baseAppRequest,
        apis: 'facilities',
      });

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        token: 'my-precious',
        kongUsername: 'FellowshipBaggins',
      });
    });

    it('succeeds for a request with only oauth api', async () => {
      const response = await request.post(route).send({
        ...baseAppRequest,
        apis: 'verification',
        oAuthRedirectURI: 'https://fake-oAuth-redirect-uri',
        oAuthApplicationType: 'web',
      });

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        clientID: 'gollum',
        clientSecret: 'mordor',
        redirectURI: 'https://fake-oAuth-redirect-uri',
      });
    });

    it('succeeds (with an empty response) for a request with only oauth api and an empty oAuthRedirectURI', async () => {
      const response = await request.post(route).send({
        ...baseAppRequest,
        apis: 'verification',
        oAuthRedirectURI: '',
        oAuthApplicationType: 'web',
      });

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({});
    });

    it('succeeds for a request with both key auth and oauth apis', async () => {
      const response = await request.post(route).send(devAppRequest);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        clientID: 'gollum',
        clientSecret: 'mordor',
        kongUsername: 'FellowshipBaggins',
        redirectURI: 'https://fake-oAuth-redirect-uri',
        token: 'my-precious',
      });
    });

    describe('when a consumer and their acls (optionally) already exist', () => {
      const consumerPath = '/internal/admin/consumers/FellowshipBaggins';
      const consumerInterceptor = kong.get(consumerPath);

      beforeEach(() => {
        nock.removeInterceptor(consumerInterceptor);
        kong.get(consumerPath).reply(200, {
          id: '123', created_at: 1008720000, username: 'frodo', custom_id: '222', tags: null,
        });
      });

      it('only consumer', async () => {
        const response = await request.post(route).send(devAppRequest);

        expect(response.status).toEqual(200);
        expect(response.body).toEqual({
          clientID: 'gollum',
          clientSecret: 'mordor',
          kongUsername: 'FellowshipBaggins',
          redirectURI: 'https://fake-oAuth-redirect-uri',
          token: 'my-precious',
        });
      });

      it('consumer and one pre-existing acl', async () => {
        const aclPath = `${consumerPath}/acls`;
        const aclInterceptor = kong.get(aclPath);
        nock.removeInterceptor(aclInterceptor);

        kong.get(aclPath).reply(200, {
          total: 1, data: [
            { group: 'va_facilities', created_at: 1040169600, id: '123', consumer: { id: '222' } },
          ],
        });

        const response = await request.post(route).send(devAppRequest);

        expect(response.status).toEqual(200);
        expect(response.body).toEqual({
          clientID: 'gollum',
          clientSecret: 'mordor',
          kongUsername: 'FellowshipBaggins',
          redirectURI: 'https://fake-oAuth-redirect-uri',
          token: 'my-precious',
        });
      });

      it('consumer and two pre-existing acls', async () => {
        const aclPath = `${consumerPath}/acls`;
        const aclInterceptor = kong.get(aclPath);
        nock.removeInterceptor(aclInterceptor);

        kong.get(aclPath).reply(200, {

          total: 2, data: [
            { group: 'va_facilities', created_at: 1040169600, id: '123', consumer: { id: '222' } },
            { group: 'veteran_verification', created_at: 1040169600, id: '123', consumer: { id: '222' } },
          ],
        });

        const response = await request.post(route).send(devAppRequest);

        expect(response.status).toEqual(200);
        expect(response.body).toEqual({
          clientID: 'gollum',
          clientSecret: 'mordor',
          kongUsername: 'FellowshipBaggins',
          redirectURI: 'https://fake-oAuth-redirect-uri',
          token: 'my-precious',
        });
      });
    });

    it('succeeds even if govDelivery fails', async () => {
      const path = '/messages/email';
      const interceptor = govDelivery.post(path);
      nock.removeInterceptor(interceptor);

      govDelivery.post(path).reply(500);

      const response = await request.post(route).send(devAppRequest);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        clientID: 'gollum',
        clientSecret: 'mordor',
        kongUsername: 'FellowshipBaggins',
        redirectURI: 'https://fake-oAuth-redirect-uri',
        token: 'my-precious',
      });
    });

    it('succeeds even if slack fails', async () => {
      const path = '/api/chat.postMessage';
      const interceptor = slack.post(path);
      nock.removeInterceptor(interceptor);

      slack.post(path).reply(500);

      const response = await request.post(route).send(devAppRequest);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        clientID: 'gollum',
        clientSecret: 'mordor',
        kongUsername: 'FellowshipBaggins',
        redirectURI: 'https://fake-oAuth-redirect-uri',
        token: 'my-precious',
      });
    });
  });

  describe('500 service failures', () => {
    describe('KongService', () => {
      it('sends 500 if it cannot POST to /internal/admin/consumers', async () => {
        const path = '/internal/admin/consumers';
        const interceptor = kong.post(path);
        nock.removeInterceptor(interceptor);

        kong.post(path).reply(500);

        const response = await request.post(route).send(devAppRequest);

        expect(response.body).toEqual({
          action: 'failed creating kong consumer',
          message: expect.stringContaining('500'),
          stack: expect.any(String),
        });
        expect(response.status).toEqual(500);
      });

      it('sends 500 if it cannot POST to /internal/admin/consumers/key-auth', async () => {
        const path = '/internal/admin/consumers/FellowshipBaggins/key-auth';
        const interceptor = kong.post(path);
        nock.removeInterceptor(interceptor);

        kong.post(path).reply(500);

        const response = await request.post(route).send(devAppRequest);

        expect(response.body).toEqual({
          action: 'failed creating kong consumer',
          message: expect.stringContaining('500'),
          stack: expect.any(String),
        });
        expect(response.status).toEqual(500);
      });

      it('sends 500 if it cannot POST to /internal/admin/consumers/FellowshipBaggins/acls', async () => {
        const path = '/internal/admin/consumers/FellowshipBaggins/acls';
        const interceptor = kong.post(path);

        nock.removeInterceptor(interceptor);
        kong.post(path).reply(500);

        const response = await request.post(route).send(devAppRequest);

        expect(response.body).toEqual({
          action: 'failed creating kong consumer',
          message: expect.stringContaining('500'),
          stack: expect.any(String),
        });
        expect(response.status).toEqual(500);
      });
    });

    describe('OktaService', () => {
      it('sends 500 if it cannot POST to /api/v1/apps', async () => {
        const path = '/api/v1/apps';
        const interceptor = okta.post(path);
        nock.removeInterceptor(interceptor);

        okta.post(path).reply(500);

        const response = await request.post(route).send(devAppRequest);

        expect(response.body).toEqual({
          action: 'failed saving to okta',
          message: expect.stringContaining('500'),
          stack: expect.any(String),
        });
        expect(response.status).toEqual(500);
      });

      it('sends 500 if it cannot PUT to /api/v1/apps/123/groups/IDME_GROUP_ID', async () => {
        const path = `/api/v1/apps/123/groups/${IDME_GROUP_ID}`;
        const interceptor = okta.put(path);
        nock.removeInterceptor(interceptor);

        okta.put(path).reply(500);

        const response = await request.post(route).send(devAppRequest);

        expect(response.body).toEqual({
          action: 'failed saving to okta',
          message: expect.stringContaining('500'),
          stack: expect.any(String),
        });
        expect(response.status).toEqual(500);
      });

      it('sends 500 if it cannot GET /api/v1/authorizationServers/API_ENDPOINT/policies', async () => {
        const verificationApiEndpoint = OKTA_AUTHZ_ENDPOINTS.verification;
        const path = `/api/v1/authorizationServers/${verificationApiEndpoint}/policies`;
        const interceptor = okta.get(path);
        nock.removeInterceptor(interceptor);

        okta.get(path).reply(500);

        const response = await request.post(route).send(devAppRequest);

        expect(response.body).toEqual({
          action: 'failed saving to okta',
          message: expect.stringContaining('500'),
          stack: expect.any(String),
        });
        expect(response.status).toEqual(500);
      });

      it('sends 500 if it cannot PUT to /api/v1/authorizationServers/API_ENDPOINT/policies/POLICY_ID', async () => {
        const verificationApiEndpoint = OKTA_AUTHZ_ENDPOINTS.verification;
        const path = `/api/v1/authorizationServers/${verificationApiEndpoint}/policies/defaultPolicyIdHere`;
        const interceptor = okta.put(path);
        nock.removeInterceptor(interceptor);

        okta.put(path).reply(500);

        const response = await request.post(route).send(devAppRequest);

        expect(response.body).toEqual({
          action: 'failed saving to okta',
          message: expect.stringContaining('500'),
          stack: expect.any(String),
        });
        expect(response.status).toEqual(500);
      });
    });

    describe('DynamoDB', () => {
      it('sends error message for dynamo failure', async () => {
        // PutItem operations/calls made with DynamoService.putItem
        const path = '/';
        const interceptor = dynamoDB.post(path);
        nock.removeInterceptor(interceptor);

        // For some reason putItem makes two calls...
        dynamoDB.post('/').reply(500).post('/').reply(500);

        const response = await request.post(route).send(devAppRequest);

        expect(response.body).toEqual({
          action: 'failed saving to dynamo',
          message: expect.stringContaining('500'),
          stack: expect.any(String),
        });
        expect(response.status).toEqual(500);
      });
    });
  });
});
