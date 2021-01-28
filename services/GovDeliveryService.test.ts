import 'jest';
import axios, { AxiosInstance } from 'axios';
import GovDeliveryService, { ConsumerSupportEmail, PublishingSupportEmail } from './GovDeliveryService';
import User from '../models/User';

describe('GovDeliveryService', () => {
  let client: GovDeliveryService;
  let event;
  let user: User;

  const mockPost = jest.fn();
  mockPost.mockResolvedValue({
    status: 200,
    statusText: 'ok',
    headers: {},
    data: {},
  });
  jest.spyOn(axios, 'create').mockReturnValue({ post: mockPost } as unknown as AxiosInstance);

  beforeEach(() => {
    client = new GovDeliveryService({
      token: process.env.GOVDELIVERY_KEY,
      host: process.env.GOVDELIVERY_HOST,
      supportEmailRecipient: 'gandalf@istari.net',
    });
    event = {
      apis: 'facilities,benefits',
      description: 'Mayhem',
      email: 'ed@adhocteam.us',
      firstName: 'Edward',
      lastName: 'Paget',
      organization: 'Ad Hoc',
      termsOfService: true,
    };
    user = new User(event);
    user.token = 'fakeKey';

    mockPost.mockClear();
  });

  describe('constructor', () => {
    it('should render the handlebars template', () => {
      const template = client.welcomeTemplate;
      const html = template({
        apis: 'VA Facilities API',
        firstName: 'Edward',
        key: 'fakeKey',
        token_issued: true,
        oauth: false,
      });
      expect(html).toEqual(expect.stringContaining('Welcome Edward'));
      expect(html).toEqual(expect.stringContaining('VA Facilities API'));
      expect(html).toEqual(expect.stringContaining('apiKey: fakeKey'));
    });

    it('should render the handlebars template with health and verification', () => {
      const template = client.welcomeTemplate;
      const html = template({
        apis: 'Health API, Veteran Verification API, and VA Facilities API',
        firstName: 'Edward',
        key: 'fakeKey',
        token_issued: true,
        oauth: true,
        clientID: 'superid',
        clientSecret: 'supersecret',
      });
      expect(html).toEqual(expect.stringContaining('Health API'));
      expect(html).toEqual(expect.stringContaining('Verification'));
      expect(html).toEqual(expect.stringContaining('superid'));
      expect(html).toEqual(expect.stringContaining('supersecret'));
    });

    it('should hide secret text when not applicable', () => {
      const template = client.welcomeTemplate;
      const html = template({
        apis: 'Health API',
        clientID: 'superid',
        firstName: 'Edward',
        oauth: true,
        token_issued: true,
      });
      expect(html).not.toEqual(expect.stringContaining('OAuth Client Secret'));
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send a request', async () => {
      await client.sendWelcomeEmail(user);
      expect(mockPost).toHaveBeenCalledWith('/messages/email', expect.objectContaining({
        recipients: [{ email: 'ed@adhocteam.us' }],
        subject: 'Welcome to the VA API Platform',
        body: expect.stringContaining('VA Facilities API and Benefits Intake API'),
      }));
    });

    it('should raise error if user lacks token and client_id', async () => {
      //Fail the test if the expectation in the catch is never
      //reached.
      expect.assertions(1);

      user.token = undefined;
      try {
        await client.sendWelcomeEmail(user);
      } catch (err) {
        expect(err.message).toEqual('User must have token or client_id initialized');
      }
    });
  });

  describe('sendConsumerSupportEmail', () => {
    it('should send a request', async () => {
      const email: ConsumerSupportEmail = {
        firstName: 'Peregrin',
        lastName: 'Took',
        requester: 'peregrin@thefellowship.org',
        description: 'Need more supplies for second breakfast',
        organization: 'The Fellowship of the Ring',
        apis: ['facilities', 'benefits'],
      };

      await client.sendConsumerSupportEmail(email);
      expect(mockPost).toHaveBeenCalledWith('/messages/email', expect.objectContaining({
        recipients: [{ email: 'gandalf@istari.net' }],
        from_name: 'Peregrin Took',
        subject: 'Support Needed',
        body: expect.stringContaining('peregrin@thefellowship.org'),
      }));
    });

    describe('sendPublishingSupportEmail', () => {
      it('should send a request', async () => {
        const email: PublishingSupportEmail = {
          firstName: 'Peregrin',
          lastName: 'Took',
          requester: 'peregrin@thefellowship.org',
          organization: 'The Fellowship of the Ring',
          apiInternalOnly: false,
          apiDetails: 'Ring',
        };
  
        await client.sendPublishingSupportEmail(email);
        expect(mockPost).toHaveBeenCalledWith('/messages/email', expect.objectContaining({
          recipients: [{ email: 'gandalf@istari.net' }],
          from_name: 'Peregrin Took',
          subject: 'Publishing Support Needed',
          body: expect.stringContaining('API Details'),
        }));
      });
    });
  });

  describe('Healthcheck Validation', () => {
    it('returns true when healthcheck endpoint returns 200', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        status: 200,
        statusText: 'ok',
        headers: {},
        data: [{}],
      });

      // cast to unknown first to avoid having to reimplement all of AxiosInstance
      jest.spyOn(axios, 'create').mockImplementation(() => ({ get: mockGet } as unknown as AxiosInstance));
      client = new GovDeliveryService({
        token: process.env.GOVDELIVERY_KEY,
        host: process.env.GOVDELIVERY_HOST,
        supportEmailRecipient: 'gandalf@istari.net',
      });
      const res = await client.healthCheck();
      expect(res).toEqual({ serviceName: 'GovDelivery', healthy: true });
    });

    it('returns false when healthcheck endpoint throws an error', async () => {
      const err = new Error(`ECONNREFUSED ${process.env.GOVDELIVERY_HOST}`);
      const mockGet = jest.fn().mockImplementation(() => { throw err; });

      // cast to unknown first to avoid having to reimplement all of AxiosInstance
      jest.spyOn(axios, 'create').mockImplementation(() => ({ get: mockGet } as unknown as AxiosInstance));
      client = new GovDeliveryService({
        token: process.env.GOVDELIVERY_KEY,
        host: process.env.GOVDELIVERY_HOST,
        supportEmailRecipient: 'gandalf@istari.net',
      });
      const res = await client.healthCheck();
      expect(res).toEqual({ serviceName: 'GovDelivery', healthy: false, err: err });
      expect(res.err.action).toEqual('checking health of GovDelivery');
    });
  });
});
