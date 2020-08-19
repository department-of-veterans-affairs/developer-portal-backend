import 'jest';
import supertest from 'supertest';
import nock from 'nock';

import configureApp from '../app';
import { IDME_GROUP_ID } from '../models/Application';

const request = supertest(configureApp());
describe('/developer_application', () => {
  const kong = nock(`http://${process.env.KONG_HOST}:8000`);
  const okta = nock(process.env.OKTA_HOST);
  const dynamoDB = nock(`${process.env.DYNAMODB_ENDPOINT}`);
  const govDelivery = nock(`https://${process.env.GOVDELIVERY_HOST}`);
  const slack = nock(process.env.SLACK_WEBHOOK);

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

  beforeEach(() => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');

    kong.get('/internal/admin/consumers/FellowshipBaggins').reply(200, {
      id: '123', created_at: 1008720000, username: 'frodo', custom_id: '222', tags: null,
    })
      .get('/internal/admin/consumers/FellowshipBaggins/acls').reply(200, {
        total: 2, data: [{ group: 'va_facilities', created_at: 1040169600, id: '123', consumer: { id: '222' } },
          { group: 'veteran_verification', created_at: 1040169600, id: '123', consumer: { id: '222' } }],
      })
      .post('/internal/admin/consumers', { username: 'FellowshipBaggins' }).reply(201, { id: '123', created_at: 1008720000, username: 'frodo', custom_id: '222', tags: null })
      .post('/internal/admin/consumers/FellowshipBaggins/key-auth').reply(201, { key: 'my-precious' });

    okta.post('/api/v1/apps').reply(200, { id: '123', credentials: { oauthClient: { client_id: 'gollum', client_secret: 'mordor' } } })
      .put(`/api/v1/apps/123/groups/${IDME_GROUP_ID}`)
      .reply(200, {});

    dynamoDB.post('/').reply(200);

    govDelivery.post('/messages/email').reply(200);

    slack.post('/').reply(200);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

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
    const response = await request.post('/developer_application').send(devAppRequest);

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      clientID: 'gollum',
      clientSecret: 'mordor',
      token: 'my-precious',
    });
  });

  it('sends 500 and Kong error message ', async () => {
    const path = '/internal/admin/consumers/FellowshipBaggins/key-auth';
    const interceptor = kong.post(path);
    nock.removeInterceptor(interceptor);

    kong.post(path).reply(500);

    const response = await request.post('/developer_application').send(devAppRequest);
    
    expect(response.status).toEqual(500);
    expect(response.body.action).toEqual('failed creating kong consumer');
    expect(response.body.message).toContain('500');
  });

  it('sends error message for okta failure', async () => {
    const path = '/api/v1/apps';
    const interceptor = okta.post(path);
    nock.removeInterceptor(interceptor);

    okta.post(path).reply(500);

    const response = await request.post('/developer_application').send(devAppRequest);
    
    expect(response.status).toEqual(500);
    expect(response.body.action).toEqual('failed saving to okta');
    expect(response.body.message).toContain('500');
  });

  it('sends error message for dynamo failure', async () => {
    const path = '/';
    const interceptor = dynamoDB.post(path);
    nock.removeInterceptor(interceptor);

    dynamoDB.post('/').reply(500);

    const response = await request.post('/developer_application').send(devAppRequest);
  
    expect(response.status).toEqual(500);
    expect(response.body.action).toEqual('failed saving to dynamo');
  });

});
