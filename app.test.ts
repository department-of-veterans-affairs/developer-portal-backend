import 'jest';
import supertest from 'supertest';

//set server environment variables before the app is loaded
process.env.KONG_KEY = 'fake-key';
process.env.KONG_HOST = 'fake-host';
import configureApp from './app';

const request = supertest(configureApp());
describe('App routing', () => {
  describe('/healthcheck', () => {
    it('succeeds on healthcheck', async () => {
      const response = await request.get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('up');
    });
  });

  describe('/developer_application', () => {
    it('sends a 4xx response and descriptive errors if validations fail', async () => {
      const response = await request.post('/developer_application').send({
        apis: 'benefits',
        email: 'eowyn@rohan.horse',
        lastName: 'Eorl',
        termsOfService: true
      });

      expect(response.status).toEqual(422);
      expect(response.body).toEqual({
        errors: ['"firstName" is required', '"organization" is required']
      });
    });
  });
});
