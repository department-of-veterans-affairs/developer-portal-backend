import 'jest';
import supertest from 'supertest';
import nock from 'nock';

import configureApp from '../../app';

const request = supertest(configureApp());
const dynamoDB = nock(`${process.env.DYNAMODB_ENDPOINT}`);
const slack = nock(`${process.env.SLACK_BASE_URL}`);

const route = '/internal/developer-portal/admin/reports/signups';
describe(route, () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  it('sends a message to slack', async () => {
    // This test is just basically just a sanity check in it's current implementation...
    // - it does not verify that the payload is correct, it just verifies that slack recieved a 'post' to the correct path
    dynamoDB.post('/').reply(200).post('/').reply(200);

    slack.post('/api/chat.postMessage').reply(200);

    expect(slack.isDone()).toEqual(false);
    const response = await request.get(route).send({});
    expect(slack.isDone()).toEqual(true);

    expect(response.status).toEqual(200);
    expect(response.text).toEqual('OK');
  });

  it('sends a 400 response and descriptive errors if validations fail', async () => {
    const response = await request.get(`${route}?span=Gimli`);

    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      errors: ['"span" must be one of [week, month]'],
    });
  });

  it('sends a 500 response if slack responds with 500', async () => {
    dynamoDB.post('/').reply(200).post('/').reply(200);

    slack.post('/api/chat.postMessage').reply(500);

    const response = await request.get(route).send({});

    expect(response.body.message).toContain('500');
    expect(response.status).toEqual(500);
  });

  it('sends a 500 response if dynamoDB responds with 500', async () => {
    dynamoDB.post('/').reply(500).persist();

    slack.post('/api/chat.postMessage').reply(200);

    const response = await request.get(route).send({});

    expect(response.body.message).toContain('500');
    expect(response.status).toEqual(500);
  });
});
