import 'jest';
import supertest from 'supertest';
import nock from 'nock';

import configureApp from '../app';
import { DevPortalError } from '../models/DevPortalError';

const request = supertest(configureApp());
const route = '/internal/developer-portal/public/contact-us';

describe(route, () => {
  if (!process.env.GOVDELIVERY_HOST) {
    throw new Error(
      'Environment variable GOVDELIVERY_HOST must be defined for SignupReports.integration test',
    );
  }

  const govDelivery = nock(process.env.GOVDELIVERY_HOST);

  const supportReq = {
    apis: ['benefits', 'facilities'],
    description: 'Need help getting to Mt. Doom',
    email: 'samwise@thefellowship.org',
    firstName: 'Samwise',
    lastName: 'Gamgee',
    organization: 'The Fellowship of the Ring',
  };

  it('sends a 400 response and descriptive errors if validations fail', async () => {
    const response = await request.post(route).send({
      description: 'Need help getting to Mt. Doom',
      email: 'samwise@thefellowship.org',
    });

    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      errors: ['"firstName" is required', '"lastName" is required'],
    });
  });

  it('sends 200 on submit of Contact Us form and sends email from GovDelivery', async () => {
    govDelivery
      .post('/messages/email')
      .reply(200, { from_email: 'samwise@thefellowship.org', from_name: 'Samwise' });

    const response = await request.post(route).send(supportReq);

    expect(response.status).toEqual(200);
  });

  it('sends error message on 500 status', async () => {
    govDelivery.post('/messages/email').reply(500);

    const response = await request.post(route).send(supportReq);
    const { action, message } = response.body as DevPortalError;

    expect(response.status).toEqual(500);
    expect(action).toEqual('sending contact us email');
    expect(message).toEqual('Request failed with status code 500');
  });
});
