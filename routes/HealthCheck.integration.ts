import 'jest';
import supertest from 'supertest';
import nock from 'nock';

import configureApp from '../app';

const request = supertest(configureApp());
describe.each([
  '/health_check',
  '/internal/developer-portal/public/health_check',
])('%s', (route: string) => {
  const kong = nock(`http://${process.env.KONG_HOST}:8000`);
  const okta = nock(process.env.OKTA_HOST);
  const dynamoDB = nock(`${process.env.DYNAMODB_ENDPOINT}`);
  const govDelivery = nock(`${process.env.GOVDELIVERY_HOST}`);
  const slack = nock(process.env.SLACK_BASE_URL);

  const kongMockPath = '/internal/admin/consumers/_internal_DeveloperPortal';
  const oktaMockPath = '/api/v1/users/me';
  const dynamoMockPath = '/';
  const govDeliveryMockPath = '/messages/email?page_size=1';
  const slackMockPath = `/api/bots.info?bot=${process.env.SLACK_BOT_ID}`;

  beforeEach(() => {
    kong.get(kongMockPath).reply(200, {
      username: "_internal_DeveloperPortal",
    });
    okta.get(oktaMockPath).reply(200, {});
    dynamoDB.post(dynamoMockPath).reply(200, '{"TableNames":["mock-table"]}');
    govDelivery.get(govDeliveryMockPath).reply(200, {});
    slack.get(slackMockPath).reply(200, { ok: true });
  });

  describe('vibrant', () => {
    it('sends 200 when all services report as healthy', async () => {
      const response = await request.get(route);

      expect(response.body).toEqual({
        healthStatus: 'vibrant',
        failedHealthChecks: [],
      });
      expect(response.status).toEqual(200);
    });
  });

  describe('lackluster', () => {
    describe('kong', () => {
      it('responds with lackluster if kong path responds with 500', async () => {
        const interceptor = kong.get(kongMockPath);
        nock.removeInterceptor(interceptor);

        kong.get(kongMockPath).reply(500);

        const response = await request.get(route);

        expect(response.body).toEqual({
          healthStatus: 'lackluster',
          failedHealthChecks: [{
            healthy: false,
            serviceName: 'Kong',
            err: expect.any(Object),
          }],
        });
        expect(response.status).toEqual(200);
      });

      it('responds with lackluster if kong path responds with wrong consumer', async () => {
        const interceptor = kong.get(kongMockPath);
        nock.removeInterceptor(interceptor);

        kong.get(kongMockPath).reply(200, {username: 'wrongUser'});

        const response = await request.get(route);

        expect(response.body).toEqual({
          healthStatus: 'lackluster',
          failedHealthChecks: [{
            healthy: false,
            serviceName: 'Kong',
            err: expect.any(Object),
          }],
        });
        expect(response.status).toEqual(200);
      });
    });

    describe('okta', () => {
      it('responds with lackluster if okta path responds with 500', async () => {
        const interceptor = okta.get(oktaMockPath);
        nock.removeInterceptor(interceptor);

        okta.get(oktaMockPath).reply(500);

        const response = await request.get(route);

        expect(response.body).toEqual({
          healthStatus: 'lackluster',
          failedHealthChecks: [{
            healthy: false,
            serviceName: 'Okta',
            err: expect.any(Object),
          }],
        });
        expect(response.status).toEqual(200);
      });
    });

    describe('dynamoDB', () => {
      it('responds with lackluster if dynamoDB path responds with 500', async () => {
        const interceptor = dynamoDB.post(dynamoMockPath);
        nock.removeInterceptor(interceptor);

        dynamoDB.post(dynamoMockPath).reply(500);

        const response = await request.get(route);

        expect(response.body).toEqual({
          healthStatus: 'lackluster',
          failedHealthChecks: [{
            healthy: false,
            serviceName: 'Dynamo',
            err: expect.any(Object),
          }],
        });
        expect(response.status).toEqual(200);
      });

      it('responds with lackluster if dynamoDB responds with no tables', async () => {
        const interceptor = dynamoDB.post(dynamoMockPath);
        nock.removeInterceptor(interceptor);

        dynamoDB.post(dynamoMockPath).reply(200, '{"TableNames":[]}');

        const response = await request.get(route);

        expect(response.body).toEqual({
          healthStatus: 'lackluster',
          failedHealthChecks: [{
            healthy: false,
            serviceName: 'Dynamo',
            err: expect.any(Object),
          }],
        });
        expect(response.status).toEqual(200);
      });
    });

    describe('govDelivery', () => {
      it('responds with lackluster if govDelivery path responds with 500', async () => {
        const interceptor = govDelivery.get(govDeliveryMockPath);
        nock.removeInterceptor(interceptor);

        govDelivery.post(govDeliveryMockPath).reply(500);

        const response = await request.get(route);

        expect(response.body).toEqual({
          healthStatus: 'lackluster',
          failedHealthChecks: [{
            healthy: false,
            serviceName: 'GovDelivery',
            err: expect.any(Object),
          }],
        });
        expect(response.status).toEqual(200);
      });

      it('responds with lackluster if govDelivery path responds with 401', async () => {
        const interceptor = govDelivery.get(govDeliveryMockPath);
        nock.removeInterceptor(interceptor);

        govDelivery.post(govDeliveryMockPath).reply(401);

        const response = await request.get(route);

        expect(response.body).toEqual({
          healthStatus: 'lackluster',
          failedHealthChecks: [{
            healthy: false,
            serviceName: 'GovDelivery',
            err: expect.any(Object),
          }],
        });
        expect(response.status).toEqual(200);
      });
    });

    describe('slack', () => {
      it('responds with lackluster if slack path responds with 500', async () => {
        const interceptor = slack.get(slackMockPath);
        nock.removeInterceptor(interceptor);

        slack.post(slackMockPath).reply(500);

        const response = await request.get(route);

        expect(response.body).toEqual({
          healthStatus: 'lackluster',
          failedHealthChecks: [{
            healthy: false,
            serviceName: 'Slack',
            err: expect.any(Object),
          }],
        });
        expect(response.status).toEqual(200);
      });

      it('responds with lackluster if slack path responds with "200, {ok: false}"', async () => {
        const interceptor = slack.get(slackMockPath);
        nock.removeInterceptor(interceptor);

        slack.post(slackMockPath).reply(200, {ok: false});

        const response = await request.get(route);

        expect(response.body).toEqual({
          healthStatus: 'lackluster',
          failedHealthChecks: [{
            healthy: false,
            serviceName: 'Slack',
            err: expect.any(Object),
          }],
        });
        expect(response.status).toEqual(200);
      });
    });
  });
});
