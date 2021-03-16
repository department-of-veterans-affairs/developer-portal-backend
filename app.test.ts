import 'jest';
import supertest from 'supertest';

import configureApp from './app';

const request = supertest(configureApp());
describe('App routing', () => {
  describe('/health', () => {
    it('succeeds on healthcheck', async () => {
      const response = await request.get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'up' });
    });
  });
});
