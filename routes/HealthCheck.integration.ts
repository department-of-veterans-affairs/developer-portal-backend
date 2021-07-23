import 'jest';
import supertest from 'supertest';
import nock from 'nock';

import configureApp from '../app';

const request = supertest(configureApp());
const route = '/internal/developer-portal/public/health_check';
describe(route, () => {
  if (!process.env.DYNAMODB_ENDPOINT) {
    throw new Error(
      'Environment variable DYNAMODB_ENDPOINT must be defined for HealthCheck.integration test',
    );
  }
  if (!process.env.KONG_HOST) {
    throw new Error(
      'Environment variable KONG_HOST must be defined for HealthCheck.integration test',
    );
  }
  if (!process.env.GOVDELIVERY_HOST) {
    throw new Error(
      'Environment variable GOVDELIVERY_HOST must be defined for HealthCheck.integration test',
    );
  }
  if (!process.env.SLACK_BOT_ID) {
    throw new Error(
      'Environment variable SLACK_BOT_ID must be defined for HealthCheck.integration test',
    );
  }
  if (!process.env.OKTA_HOST) {
    throw new Error(
      'Environment variable OKTA_HOST must be defined for HealthCheck.integration test',
    );
  }
  if (!process.env.SLACK_BASE_URL) {
    throw new Error(
      'Environment variable SLACK_BASE_URL must be defined for HealthCheck.integration test',
    );
  }

  const kong = nock(`http://${process.env.KONG_HOST}:8000`);
  const okta = nock(process.env.OKTA_HOST);
  const dynamoDB = nock(process.env.DYNAMODB_ENDPOINT);
  const govDelivery = nock(process.env.GOVDELIVERY_HOST);
  const slack = nock(process.env.SLACK_BASE_URL);

  const kongMockPath = '/internal/admin/consumers/_internal_DeveloperPortal';
  const oktaMockPath = '/api/v1/users/me';
  const dynamoMockPath = '/';
  const govDeliveryMockPath = '/messages/email?page_size=1';
  const slackMockPath = `/api/bots.info?bot=${process.env.SLACK_BOT_ID}`;

  beforeEach(() => {
    kong.get(kongMockPath).reply(200, {
      username: '_internal_DeveloperPortal',
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
        failedHealthChecks: [],
        healthStatus: 'vibrant',
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
          failedHealthChecks: [
            {
              err: expect.any(Object) as unknown,
              healthy: false,
              serviceName: 'Kong',
            },
          ],
          healthStatus: 'lackluster',
        });
        expect(response.status).toEqual(200);
      });

      it('responds with lackluster if kong path responds with wrong consumer', async () => {
        const interceptor = kong.get(kongMockPath);
        nock.removeInterceptor(interceptor);

        kong.get(kongMockPath).reply(200, { username: 'wrongUser' });

        const response = await request.get(route);

        expect(response.body).toEqual({
          failedHealthChecks: [
            {
              err: expect.any(Object) as unknown,
              healthy: false,
              serviceName: 'Kong',
            },
          ],
          healthStatus: 'lackluster',
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
          failedHealthChecks: [
            {
              err: expect.any(Object) as unknown,
              healthy: false,
              serviceName: 'Okta',
            },
          ],
          healthStatus: 'lackluster',
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
          failedHealthChecks: [
            {
              err: expect.any(Object) as unknown,
              healthy: false,
              serviceName: 'Dynamo',
            },
          ],
          healthStatus: 'lackluster',
        });
        expect(response.status).toEqual(200);
      });

      it('responds with lackluster if dynamoDB responds with no tables', async () => {
        const interceptor = dynamoDB.post(dynamoMockPath);
        nock.removeInterceptor(interceptor);

        dynamoDB.post(dynamoMockPath).reply(200, '{"TableNames":[]}');

        const response = await request.get(route);

        expect(response.body).toEqual({
          failedHealthChecks: [
            {
              err: expect.any(Object) as unknown,
              healthy: false,
              serviceName: 'Dynamo',
            },
          ],
          healthStatus: 'lackluster',
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
          failedHealthChecks: [
            {
              err: expect.any(Object) as unknown,
              healthy: false,
              serviceName: 'GovDelivery',
            },
          ],
          healthStatus: 'lackluster',
        });
        expect(response.status).toEqual(200);
      });

      it('responds with lackluster if govDelivery path responds with 401', async () => {
        const interceptor = govDelivery.get(govDeliveryMockPath);
        nock.removeInterceptor(interceptor);

        govDelivery.post(govDeliveryMockPath).reply(401);

        const response = await request.get(route);

        expect(response.body).toEqual({
          failedHealthChecks: [
            {
              err: expect.any(Object) as unknown,
              healthy: false,
              serviceName: 'GovDelivery',
            },
          ],
          healthStatus: 'lackluster',
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
          failedHealthChecks: [
            {
              err: expect.any(Object) as unknown,
              healthy: false,
              serviceName: 'Slack',
            },
          ],
          healthStatus: 'lackluster',
        });
        expect(response.status).toEqual(200);
      });

      it('responds with lackluster if slack path responds with "200, {ok: false}"', async () => {
        const interceptor = slack.get(slackMockPath);
        nock.removeInterceptor(interceptor);

        slack.post(slackMockPath).reply(200, { ok: false });

        const response = await request.get(route);

        expect(response.body).toEqual({
          failedHealthChecks: [
            {
              err: expect.any(Object) as unknown,
              healthy: false,
              serviceName: 'Slack',
            },
          ],
          healthStatus: 'lackluster',
        });
        expect(response.status).toEqual(200);
      });
    });
  });
});
