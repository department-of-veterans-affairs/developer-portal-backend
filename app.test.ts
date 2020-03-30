import 'jest'
import configureApp from './app'
import supertest from 'supertest'

const request = supertest(configureApp())
describe("App routing", () => {
  
  describe("simple healthcheck endpoint", () => {
    it('responds to get', async () => {
      const response = await request.get('/')

      expect(response.status).toBe(200)
      expect(response.text).toBe('hello')
    })
  })

  describe("/developer_application endpoint", () => {
    xit('responds to post', async () => {
      const response = await request.post('/developer_application')

      expect(response.status).toBe(200)
      expect(response.text).toBe('success')
    })

    it('rejects get', async () => {
      const response = await request.get('/developer_application')

      expect(response.status).toBe(404)
    })
  })
})
