import 'jest';
import axios, { AxiosInstance } from 'axios';
import GovDeliveryService,
{ ConsumerSupportEmail,
  PublishingSupportEmail,
  ProductionAccessSupportEmail } from './GovDeliveryService';
import User from '../models/User';

const { GOVDELIVERY_KEY, GOVDELIVERY_HOST, SUPPORT_EMAIL } = process.env;

if (!GOVDELIVERY_KEY || !GOVDELIVERY_HOST || !SUPPORT_EMAIL) {
  throw new Error(
    'Environment variable configuration is required to test GovDeliveryService'
  );
}

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
      token: GOVDELIVERY_KEY,
      host: GOVDELIVERY_HOST,
      supportEmailRecipient: SUPPORT_EMAIL,
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
        body: expect.stringContaining('VA Facilities API and Benefits Intake API') as unknown,
      }));
    });

    it('should raise error if user lacks token and client_id', async () => {
      //Fail the test if the expectation in the catch is never
      //reached.
      expect.assertions(1);

      user.token = undefined;
      try {
        await client.sendWelcomeEmail(user);
      } catch (err: unknown) {
        expect((err as Error).message).toEqual('User must have token or client_id initialized');
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
        recipients: [{ email: SUPPORT_EMAIL }],
        from_name: 'Peregrin Took',
        subject: 'Support Needed',
        body: expect.stringContaining('peregrin@thefellowship.org') as unknown,
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
          recipients: [{ email: SUPPORT_EMAIL }],
          from_name: 'Peregrin Took',
          subject: 'Publishing Support Needed',
          body: expect.stringContaining('API Details') as unknown,
        }));
      });
    });

    describe('sendProductionAccessEmail', () => {
      it('should send a request', async () => {
        const email: ProductionAccessSupportEmail = {
          primaryContact: {
            firstName: 'Samwise',
            lastName: 'Gamgee',
            email: 'sam@fellowship.com',
          },
          secondaryContact: {
            firstName: 'Frodo',
            lastName: 'Baggins',
            email: 'frodo@fellowship.com',
          },
          organization: 'Sauron.INC',
          appName: 'One to Bind Them',
          appDescription: 'A social media platform with one room.',
          statusUpdateEmails: ['sam@fellowship.com'],
          valueProvided: 'n/a',
          businessModel: 'magical rings >> profit',
          policyDocuments: ['www.example.com/tos'],
          phoneNumber: '867-5309',
          apis: ['benefits'],
          monitizedVeteranInformation: false,
          monitizationExplanation: 'n/a',
          veteranFacing: false,
          website: 'www.one2bindthem.com',
          signUpLink: 'www.one2bindthem.com/signup',
          supportLink: 'www.one2bindthem.com/support',
          platforms: ['iOS'],
          veteranFacingDescription: 'Now the Elves made many rings; but secretly Sauron made One Ring to rule all the others, and their power was bound up with it, to be subject wholly to it and to last only so long as it too should last.',
          vasiSystemName: 'asdf',
          credentialStorage: '',
          storePIIOrPHI: false,
          storageMethod: 'Locking away in the fires from whence it came.',
          safeguards: 'golem',
          breachManagementProcess: 'golem',
          vulnerabilityManagement: 'golem',
          exposeHealthInformationToThirdParties: false,
          thirdPartyHealthInfoDescription: 'n/a',
          scopesAccessRequested: ['profile', 'email'],
          distrubitingAPIKeysToCustomers: false,
          namingConvention: 'overly-complicated',
          centralizedBackendLog: 'non-existent',
          listedOnMyHealthApplication: false,
        };
        await client.sendProductionAccessEmail(email);
        expect(mockPost).toHaveBeenCalledWith('/messages/email', expect.objectContaining({
          recipients: [{ email: SUPPORT_EMAIL }],
          from_name: 'Samwise Gamgee',
          subject: 'Production Access Requested',
          body: expect.stringContaining('Primary Contact:') as unknown,
        }));
      });
    });

    describe('sendProductionAccessConsumerEmail', () => {
      it('should send a request', async () => {
        const emails: string[] = ['ed@adhocteam.us'];
        await client.sendProductionAccessConsumerEmail(emails);
        expect(mockPost).toHaveBeenCalledWith('/messages/email', expect.objectContaining({
          recipients: [{ email: 'ed@adhocteam.us' }],
          subject: 'Your Request for Production Access is Submitted',
          body: expect.stringContaining('We’ve received your request for production access.') as unknown,
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
        token: GOVDELIVERY_KEY,
        host: GOVDELIVERY_HOST,
        supportEmailRecipient: SUPPORT_EMAIL,
      });
      const res = await client.healthCheck();
      expect(res).toEqual({ serviceName: 'GovDelivery', healthy: true });
    });

    it('returns false when healthcheck endpoint throws an error', async () => {
      const err = new Error(`ECONNREFUSED ${GOVDELIVERY_HOST}`);
      const mockGet = jest.fn().mockImplementation(() => { throw err; });

      // cast to unknown first to avoid having to reimplement all of AxiosInstance
      jest.spyOn(axios, 'create').mockImplementation(() => ({ get: mockGet } as unknown as AxiosInstance));
      client = new GovDeliveryService({
        token: GOVDELIVERY_KEY,
        host: GOVDELIVERY_HOST,
        supportEmailRecipient: SUPPORT_EMAIL,
      });
      const res = await client.healthCheck();
      expect(res).toEqual({ serviceName: 'GovDelivery', healthy: false, err: err });
      expect(res.err?.action).toEqual('checking health of GovDelivery');
    });
  });
});
