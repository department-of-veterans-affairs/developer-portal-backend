import axios, { AxiosInstance } from 'axios'
import SlackService from './SlackService'

describe('SlackService', () => {
  it('sends a provided bearer token', () => {
    const mockCreate = jest.spyOn(axios, 'create')
    new SlackService('channel123', 'fakeToken')

    expect(mockCreate).toHaveBeenCalledWith({
      baseURL: 'https://slack.com/api',
      headers: { 'Authorization': `Bearer fakeToken` }
    })
  })

  it('sends a success message', async () => {
    const mockPost = jest.fn().mockResolvedValue({
      status: 200,
      statusText: 'ok',
      headers: {},
    })

    jest.spyOn(axios, 'create').mockImplementation(() => ({ post: mockPost } as unknown as AxiosInstance))

    const message = "Test, User: test@example.com\nRequested access to:\n* va_facilities\n* health\n"
    const service = new SlackService('channel123', 'faketoken')

    const res = await service.sendSuccessMessage(message, 'New User Application')

    expect(res.status).toEqual(200)
    expect(mockPost).toHaveBeenCalledWith('/chat.postMessage', {
      channel: 'channel123',
      text: '',
      attachments: [{
        text: message,
        fallback: message,
        color: 'good',
        title: 'New User Application',
      }]
    })
  })

  it('sends a failure message', async () => {
    const mockPost = jest.fn().mockResolvedValue({
      status: 200,
      statusText: 'ok',
      headers: {},
    })
    
    jest.spyOn(axios, 'create').mockImplementation(() => ({ post: mockPost } as unknown as AxiosInstance))

    const message = "Test, User: test@example.com\nRequested access to:\n* va_facilities\n* health\n"
    const service = new SlackService('channel123', 'faketoken')

    const res = await service.sendFailureMessage(message, 'User Signup Failed')

    expect(res.status).toEqual(200)
    expect(mockPost).toHaveBeenCalledWith('/chat.postMessage', {
      channel: 'channel123',
      text: '',
      attachments: [{
        text: message,
        fallback: message,
        color: 'danger',
        title: 'User Signup Failed',
      }]
    })
  })
})
