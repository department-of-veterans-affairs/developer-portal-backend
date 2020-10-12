import 'jest';
import supertest from 'supertest';
import nock from 'nock';

import configureApp from '../app';

const request = supertest(configureApp());
describe('/health_check', () => {
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
      const response = await request.get('/health_check');

      expect(response.status).toEqual(200);
      expect(response.body.healthStatus).toEqual('vibrant');
      expect(response.body.failedHealthChecks).toEqual([]);
    });
  });

  describe('lackluster', () => {
    // mocking the individual services health check path to return a 500 is just one of the ways the health check could fail...
    // they could also fail for a 403 or a unexpected / unproccessable payload

    it('responds with lackluster if kong does not report as healthy', async () => {
      const interceptor = kong.get(kongMockPath);
      nock.removeInterceptor(interceptor);

      kong.get(kongMockPath).reply(500);

      const response = await request.get('/health_check');

      expect(response.status).toEqual(200);
      expect(response.body.healthStatus).toEqual('lackluster');
      expect(response.body.failedHealthChecks.length).toEqual(1);
      expect(response.body.failedHealthChecks[0].healthy).toEqual(false);
      expect(response.body.failedHealthChecks[0].serviceName).toEqual('Kong');
    });

    it('responds with lackluster if okta does not report as healthy', async () => {
      const interceptor = okta.get(oktaMockPath);
      nock.removeInterceptor(interceptor);

      okta.get(oktaMockPath).reply(500);

      const response = await request.get('/health_check');

      expect(response.status).toEqual(200);
      expect(response.body.healthStatus).toEqual('lackluster');
      expect(response.body.failedHealthChecks.length).toEqual(1);
      expect(response.body.failedHealthChecks[0].healthy).toEqual(false);
      expect(response.body.failedHealthChecks[0].serviceName).toEqual('Okta');
    });

    it('responds with lackluster if dynamoDB does not report as healthy', async () => {
      const interceptor = dynamoDB.post(dynamoMockPath);
      nock.removeInterceptor(interceptor);

      dynamoDB.post(dynamoMockPath).reply(500);

      const response = await request.get('/health_check');

      expect(response.status).toEqual(200);
      expect(response.body.healthStatus).toEqual('lackluster');
      expect(response.body.failedHealthChecks.length).toEqual(1);
      expect(response.body.failedHealthChecks[0].healthy).toEqual(false);
      expect(response.body.failedHealthChecks[0].serviceName).toEqual('Dynamo');
    });

    it('responds with lackluster if govDelivery does not report as healthy', async () => {
      const interceptor = govDelivery.get(govDeliveryMockPath);
      nock.removeInterceptor(interceptor);

      govDelivery.post(govDeliveryMockPath).reply(500);

      const response = await request.get('/health_check');

      expect(response.status).toEqual(200);
      expect(response.body.healthStatus).toEqual('lackluster');
      expect(response.body.failedHealthChecks.length).toEqual(1);
      expect(response.body.failedHealthChecks[0].healthy).toEqual(false);
      expect(response.body.failedHealthChecks[0].serviceName).toEqual('GovDelivery');
    });

    it('responds with lackluster if slack does not report as healthy', async () => {
      const interceptor = slack.get(slackMockPath);
      nock.removeInterceptor(interceptor);

      slack.post(slackMockPath).reply(500);

      const response = await request.get('/health_check');

      expect(response.status).toEqual(200);
      expect(response.body.healthStatus).toEqual('lackluster');
      expect(response.body.failedHealthChecks.length).toEqual(1);
      expect(response.body.failedHealthChecks[0].healthy).toEqual(false);
      expect(response.body.failedHealthChecks[0].serviceName).toEqual('Slack');
    });
  });
});
