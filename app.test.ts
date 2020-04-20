import 'jest'
import supertest from 'supertest'

//set server environment variables before the app is loaded
process.env.KONG_KEY = "fake-key"
process.env.KONG_HOST = "fake-host"
import configureApp from './app'

const request = supertest(configureApp())
describe("App routing", () => {
  describe("simple healthcheck endpoint", () => {
    it('succeeds on healthcheck', async () => {
      const response = await request.get('/health')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('up')
    })
  })

  describe("/developer_application endpoint", () => {
    xit('responds to post', async () => {
      const response = await request.post('/developer_application')

      expect(response.status).toBe(200)
      expect(response.text).toBe('success')
    })
  })
})
