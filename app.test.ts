import 'jest';
import configureApp from './app';
import supertest from 'supertest';

const request = supertest(configureApp());
describe("App routing", () => {
  
  describe("/hello endpoint", () => {
    it('responds to get', async done => {
      const response = await request.get('/hello');

      expect(response.status).toBe(200);
      expect(response.text).toBe('hello');
      done();
    });
  });

  describe("/developer_application endpoint", () => {
    it('responds to post', async done => {
      const response = await request.post('/developer_application');

      expect(response.status).toBe(200);
      expect(response.text).toBe('success');
      done();
    });

    it('rejects get', async done => {
      const response = await request.get('/developer_application');

      expect(response.status).toBe(404);
      done();
    });
  });
});
