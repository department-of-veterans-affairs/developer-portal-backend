import 'jest';
import supertest from 'supertest';

import configureApp from './app';

const request = supertest(configureApp());
describe('App routing', () => {
  describe('/health', () => {
    it('succeeds on healthcheck', async () => {
      const response = await request.get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('up');
    });
  });
});

describe('/reports/signups', () => {
  it('sends a 400 response and descriptive errors if validations fail', async () => {
    const response = await request.get('/reports/signups?span=Gimli');

    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      errors: ['"span" must be one of [week, month]'],
    });
  });
});
