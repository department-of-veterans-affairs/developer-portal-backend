import 'jest';
import supertest from 'supertest';
import nock from 'nock';

import configureApp from '../app';

const request = supertest(configureApp());
describe('/contact-us', () => {
  const govDelivery = nock(`https://${process.env.GOVDELIVERY_HOST}`);

  const supportReq = {
    firstName: 'Samwise',
    lastName: 'Gamgee',
    email: 'samwise@thefellowship.org',
    organization: 'The Fellowship of the Ring',
    description: 'Need help getting to Mt. Doom',
    apis: ['benefits', 'facilities'],
  };

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
    govDelivery
      .post('/messages/email')
      .reply(200, { from_name: 'Samwise', from_email: 'samwise@thefellowship.org' });

    const response = await request.post('/contact-us').send(supportReq);

    expect(response.status).toEqual(200);
  });

  it('sends error message on 500 status', async () => {
    govDelivery
      .post('/messages/email')
      .reply(500);

    const response = await request.post('/contact-us').send(supportReq);
    console.log(response.body.message);
    expect(response.status).toEqual(500);
    expect(response.body.action).toEqual('sending contact us email');
    expect(response.body.message).toEqual('Request failed with status code 500');
  });
});
