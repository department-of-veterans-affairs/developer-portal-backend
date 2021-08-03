import axios, { AxiosInstance } from 'axios';
import moment from 'moment';
import SlackService from './SlackService';

describe('SlackService', () => {
  const slackURL = 'https://beacons.gondor.gov';
  const slackToken = 'gondor-calls-for-aid';
  const slackOptions = {
    bot: 'DenethorBot',
    channel: '#a-long-expected-party',
  };

  it('sends a provided bearer token', () => {
    const mockCreate = jest.spyOn(axios, 'create');

    // eslint-disable-next-line no-new
    new SlackService(slackURL, slackToken, slackOptions);

    expect(mockCreate).toHaveBeenCalledWith({
      baseURL: slackURL,
      headers: {
        Authorization: `Bearer ${slackToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
    });
  });

  it('sends a success message', async () => {
    const mockPost = jest.fn().mockResolvedValue({
      data: 'ok',
      headers: {},
      status: 200,
      statusText: 'ok',
    });

    // cast to unknown first to avoid having to reimplement all of AxiosInstance
    jest
      .spyOn(axios, 'create')
      .mockImplementation(() => ({ post: mockPost } as unknown as AxiosInstance));

    const message =
      'Son of Denethor, Faramir: faramir@rangers.gondor.mil\nRequested access to:\n* va_facilities\n* health\n';
    const service = new SlackService(slackURL, slackToken, slackOptions);

    const res = await service.sendSuccessMessage(message, 'New User Application');

    expect(res).toEqual('ok');
    expect(mockPost).toHaveBeenCalledWith('/api/chat.postMessage', {
      attachments: [
        {
          color: 'good',
          fallback: message,
          text: message,
          title: 'New User Application',
        },
      ],
      channel: slackOptions.channel,
      text: '',
    });
  });

  it('sends a formatted wrap-up message', async () => {
    const mockPost = jest.fn().mockResolvedValue({
      data: 'ok',
      headers: {},
      status: 200,
      statusText: 'ok',
    });

    jest
      .spyOn(axios, 'create')
      .mockImplementation(() => ({ post: mockPost } as unknown as AxiosInstance));

    const service = new SlackService(slackURL, slackToken, slackOptions);
    const end = moment('2003-12-17T00:00:00.000Z');
    const formattedEnd = end.utc().format('MM/DD/YYYY');
    const duration = 'week';

    const thisWeek = {
      apiCounts: {
        benefits: 1,
        claims: 0,
        communityCare: 0,
        confirmation: 0,
        facilities: 0,
        health: 2,
        vaForms: 0,
        verification: 0,
      },
      total: 2,
    };

    const allTime = {
      apiCounts: {
        benefits: 1,
        claims: 8,
        communityCare: 6,
        confirmation: 4,
        facilities: 2,
        health: 5,
        vaForms: 3,
        verification: 7,
      },
      total: 12,
    };

    const res = await service.sendSignupsMessage(duration, formattedEnd, thisWeek, allTime);

    expect(res).toEqual('ok');
    expect(mockPost).toHaveBeenCalledWith('/api/chat.postMessage', {
      blocks: [
        {
          text: {
            text: '*Weekly Sign-ups and Access Requests* for Week Ending 12/17/2003',
            type: 'mrkdwn',
          },
          type: 'section',
        },
        {
          text: {
            text: '*Environment:* Test',
            type: 'mrkdwn',
          },
          type: 'section',
        },
        {
          type: 'divider',
        },
        {
          text: {
            text: '*New User Sign-ups* (excludes established users requesting additional APIs)',
            type: 'mrkdwn',
          },
          type: 'section',
        },
        {
          fields: [
            {
              text: '_This week:_ 2 new users',
              type: 'mrkdwn',
            },
            {
              text: '_All-time:_ 12 new users',
              type: 'mrkdwn',
            },
          ],
          type: 'section',
        },
        {
          type: 'divider',
        },
        {
          text: {
            text: '*API Access Requests* (includes new users, and established users requesting additional APIs)',
            type: 'mrkdwn',
          },
          type: 'section',
        },
        {
          fields: [
            { text: '_benefits_: 1 new requests (1 all-time)', type: 'mrkdwn' },
            { text: '_claims_: 0 new requests (8 all-time)', type: 'mrkdwn' },
            { text: '_communityCare_: 0 new requests (6 all-time)', type: 'mrkdwn' },
            { text: '_confirmation_: 0 new requests (4 all-time)', type: 'mrkdwn' },
            { text: '_facilities_: 0 new requests (2 all-time)', type: 'mrkdwn' },
            { text: '_health_: 2 new requests (5 all-time)', type: 'mrkdwn' },
            { text: '_vaForms_: 0 new requests (3 all-time)', type: 'mrkdwn' },
            { text: '_verification_: 0 new requests (7 all-time)', type: 'mrkdwn' },
          ],
          type: 'section',
        },
        {
          type: 'divider',
        },
        {
          text: {
            text: '_Have questions about these numbers? Read <https://community.max.gov/display/VAExternal/Calculating Sandbox Signups|how we calculate signups>._',
            type: 'mrkdwn',
          },
          type: 'section',
        },
      ],
      channel: slackOptions.channel,
    });
  });

  it('re-tags the error message if the error contains a response', async () => {
    expect.assertions(1);

    const mockPost = jest.fn().mockRejectedValue({
      response: {
        data: 'did it wrong',
        status: 400,
      },
      status: 400,
      statusText: 'bad-request',
    });

    // cast to unknown first to avoid having to reimplement all of AxiosInstance
    jest
      .spyOn(axios, 'create')
      .mockImplementation(() => ({ post: mockPost } as unknown as AxiosInstance));

    const message =
      'Son of Denethor, Faramir: faramir@rangers.gondor.mil\nRequested access to:\n* va_facilities\n* health\n';
    const service = new SlackService(slackURL, slackToken, slackOptions);

    try {
      await service.sendSuccessMessage(message, 'New User Application');
    } catch (err: unknown) {
      expect((err as Error).message).toEqual(
        'Status: 400, Data: "did it wrong", Original: undefined',
      );
    }
  });

  it('returns false when chat.postMessage endpoint returns an ok false', async () => {
    expect.assertions(1);

    const mockPost = jest.fn().mockResolvedValue({
      data: { error: 'channel_not_found', ok: false },
      headers: {},
      status: 200,
    });

    // cast to unknown first to avoid having to reimplement all of AxiosInstance
    jest
      .spyOn(axios, 'create')
      .mockImplementation(() => ({ post: mockPost } as unknown as AxiosInstance));

    const message =
      'Son of Denethor, Faramir: faramir@rangers.gondor.mil\nRequested access to:\n* va_facilities\n* health\n';
    const service = new SlackService(slackURL, slackToken, slackOptions);

    try {
      await service.sendSuccessMessage(message, 'New User Application');
    } catch (err: unknown) {
      expect((err as Error).message).toEqual('channel_not_found');
    }
  });

  describe('Healthcheck Validation', () => {
    it('returns true when healthcheck endpoint returns an ok true', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: { ok: true },
        headers: {},
        status: 200,
        statusText: 'ok',
      });

      // cast to unknown first to avoid having to reimplement all of AxiosInstance
      jest
        .spyOn(axios, 'create')
        .mockImplementation(() => ({ get: mockGet } as unknown as AxiosInstance));

      const service = new SlackService(slackURL, slackToken, slackOptions);
      const res = await service.healthCheck();
      expect(mockGet).toHaveBeenCalledWith('/api/bots.info', {
        params: {
          bot: slackOptions.bot,
        },
      });
      expect(res).toEqual({ healthy: true, serviceName: 'Slack' });
    });

    it('returns false when healthcheck endpoint returns an ok false', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: { ok: false },
        headers: {},
        status: 200,
      });

      // cast to unknown first to avoid having to reimplement all of AxiosInstance
      jest
        .spyOn(axios, 'create')
        .mockImplementation(() => ({ get: mockGet } as unknown as AxiosInstance));

      const service = new SlackService(slackURL, slackToken, slackOptions);
      const res = await service.healthCheck();
      expect(res.serviceName).toEqual('Slack');
      expect(res.healthy).toBeFalsy();
    });

    it('returns false when bot.info has an error', async () => {
      const err = new Error('ECONNREFUSED http://numenor-fake-slack');
      const mockGet = jest.fn().mockImplementation(() => {
        throw err;
      });

      // cast to unknown first to avoid having to reimplement all of AxiosInstance
      jest
        .spyOn(axios, 'create')
        .mockImplementation(() => ({ get: mockGet } as unknown as AxiosInstance));

      const service = new SlackService(slackURL, slackToken, slackOptions);
      const res = await service.healthCheck();
      expect(res).toEqual({ err, healthy: false, serviceName: 'Slack' });
    });
  });
});
