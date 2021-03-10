import 'jest';
import supertest from 'supertest';

import configureApp from './app';

const request = supertest(configureApp());
describe('App routing', () => {
  describe('/health', () => {
    it('succeeds on healthcheck', async () => {
      const { status, body } = await request.get('/health');

      expect(status).toBe(200);
      expect(body).toEqual({
        status: 'up',
	version: 'test version',
	commitHash: 'test commit hash',
      });
    });
  });
});
