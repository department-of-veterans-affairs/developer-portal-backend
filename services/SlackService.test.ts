import axios, { AxiosInstance } from 'axios';
import SlackService from './SlackService';

describe('SlackService', () => {
  const hookUrl = 'https://beacons.gondor.gov';
  const hookConfig = {
    channel: '#gondor-chat',
    username: 'StewardBot',
    icon_emoji: ':minas-tirith:',
  };

  it('sends a provided bearer token', () => {
    const mockCreate = jest.spyOn(axios, 'create');
    new SlackService(hookUrl, hookConfig);

    expect(mockCreate).toHaveBeenCalledWith({ baseURL: hookUrl });
  });

  it('sends a success message', async () => {
    const mockPost = jest.fn().mockResolvedValue({
      status: 200,
      statusText: 'ok',
      headers: {},
      data: 'ok',
    });

    // cast to unknown first to avoid having to reimplement all of AxiosInstance
    jest.spyOn(axios, 'create').mockImplementation(() => ({ post: mockPost } as unknown as AxiosInstance));

    const message = "Son of Denethor, Faramir: faramir@rangers.gondor.mil\nRequested access to:\n* va_facilities\n* health\n";
    const service = new SlackService(hookUrl, hookConfig);

    const res = await service.sendSuccessMessage(message, 'New User Application');

    expect(res).toEqual('ok');
    expect(mockPost).toHaveBeenCalledWith('', {
      channel: hookConfig.channel,
      username: hookConfig.username,
      icon_emoji: hookConfig.icon_emoji,
      text: '',
      attachments: [{
        text: message,
        fallback: message,
        color: 'good',
        title: 'New User Application',
      }],
    });
  });

  it('re-tags the error message if the error contains a response', async () => {
    expect.assertions(1);

    const mockPost = jest.fn().mockRejectedValue({
      status: 400,
      statusText: 'bad-request',
      response: {
        status: 400,
        data: 'did it wrong',
      },
    });

    // cast to unknown first to avoid having to reimplement all of AxiosInstance
    jest.spyOn(axios, 'create').mockImplementation(() => ({ post: mockPost } as unknown as AxiosInstance));

    const message = "Son of Denethor, Faramir: faramir@rangers.gondor.mil\nRequested access to:\n* va_facilities\n* health\n";
    const service = new SlackService(hookUrl, hookConfig);

    try {
      await service.sendSuccessMessage(message, 'New User Application');
    } catch (err) {
      expect(err.message).toEqual('Status: 400, Data: did it wrong, Original: undefined');
    }
  });
});
