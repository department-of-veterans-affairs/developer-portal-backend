import 'jest';
import supertest from 'supertest';
import nock from 'nock';

import configureApp from '../../app';

const request = supertest(configureApp());
describe('/reports/signups', () => {
  it('sends a message to slack', async () => {
    // This test is just basically just a sanity check in it's current implementation...
    // - it does not verify that the payload is correct, it just verifies that slack recieved a 'post' to the correct path
    const dynamoDB = nock(`${process.env.DYNAMODB_ENDPOINT}`);
    dynamoDB.post('/').reply(200).post('/').reply(200);

    const slack = nock(process.env.SLACK_BASE_URL);
    slack.post('/api/chat.postMessage').reply(200);

    expect(slack.isDone()).toEqual(false);
    const response = await request.get('/reports/signups').send({});
    expect(slack.isDone()).toEqual(true);

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({});
  });
});
