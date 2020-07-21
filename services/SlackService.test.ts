import axios, { AxiosInstance } from 'axios';
import moment from 'moment';
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

  it('sends a formatted wrap-up message', async () => {
    const mockPost = jest.fn().mockResolvedValue({
      status: 200,
      statusText: 'ok',
      headers: {},
      data: 'ok',
    });

    jest.spyOn(axios, 'create').mockImplementation(() => ({ post: mockPost } as unknown as AxiosInstance));

    const service = new SlackService(hookUrl, hookConfig);
    const end = moment('2003-12-17T00:00:00.000Z');
    const formattedEnd = end.utc().format('MM/DD/YYYY');
    const duration = 'week';

    const thisWeek = {
      total: 2,
      apiCounts: {
        benefits: 1,
        facilities: 0,
        vaForms: 0,
        confirmation: 0,
        health: 2,
        communityCare: 0,
        verification: 0,
        claims: 0,
      },
    };

    const allTime = { 
      total: 12,
      apiCounts: {
        benefits: 1,
        facilities: 2,
        vaForms: 3,
        confirmation: 4,
        health: 5,
        communityCare: 6,
        verification: 7,
        claims: 8,
      },
    };

    const res = await service.sendSignupsMessage(duration, formattedEnd, thisWeek, allTime);

    expect(res).toEqual('ok');
    expect(mockPost).toHaveBeenCalledWith('', {
      channel: hookConfig.channel,
      username: hookConfig.username,
      icon_emoji: hookConfig.icon_emoji,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Weekly Sign-ups and Access Requests* for Week Ending 12/17/2003'
          }
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*New User Sign-ups* (excludes established users requesting additional APIs)'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: '_This week:_ 2 new users'
            },
            {
              type: 'mrkdwn',
              text: '_All-time:_ 12 new users'
            }
          ]
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*API Access Requests* (includes new users, and established users requesting additional APIs)'
          }
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: '_benefits_: 1 new requests (1 all-time)'},
            { type: 'mrkdwn', text: '_facilities_: 0 new requests (2 all-time)'},
            { type: 'mrkdwn', text: '_vaForms_: 0 new requests (3 all-time)'},
            { type: 'mrkdwn', text: '_confirmation_: 0 new requests (4 all-time)'},
            { type: 'mrkdwn', text: '_health_: 2 new requests (5 all-time)'},
            { type: 'mrkdwn', text: '_communityCare_: 0 new requests (6 all-time)'},
            { type: 'mrkdwn', text: '_verification_: 0 new requests (7 all-time)'},
            { type: 'mrkdwn', text: '_claims_: 0 new requests (8 all-time)'},
          ],
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '_Have questions about these numbers? Read <https://community.max.gov/display/VAExternal/Calculating Sandbox Signups|how we calculate signups>._'
          }
        }
      ]
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
