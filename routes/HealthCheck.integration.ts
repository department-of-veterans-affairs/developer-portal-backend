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

  it('sends 200 when all services report as healthy', async () => {
    kong.get('/internal/admin/consumers/_internal_DeveloperPortal').reply(200, {
      id: '123', created_at: 1008720000, username: '_internal_DeveloperPortal', custom_id: '222', tags: null,
    });
    okta.get('/api/v1/users/me').reply(200, {});
    dynamoDB.post('/').reply(200, '{"TableNames":["mock-table"]}');
    govDelivery.get('/messages/email?page_size=1').reply(200, {})
    slack.get(`/api/bots.info?bot=${process.env.SLACK_BOT_ID}`).reply(200, {ok: true})

    const response = await request.get('/health_check')

    expect(response.status).toEqual(200);
    expect(response.body.healthStatus).toEqual('vibrant');
    expect(response.body.failedHealthChecks).toEqual([]);
  });
});
