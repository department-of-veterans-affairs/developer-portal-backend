/* eslint-disable @typescript-eslint/no-unsafe-call */

import 'jest';
import axios, { AxiosInstance } from 'axios';
import User from '../models/User';
import { ProductionAccessSupportEmail } from '../types/ProductionAccess';
import GovDeliveryService, {
  ConsumerSupportEmail,
  PublishingSupportEmail,
} from './GovDeliveryService';

const { GOVDELIVERY_KEY, GOVDELIVERY_HOST, SUPPORT_EMAIL } = process.env;

if (!GOVDELIVERY_KEY || !GOVDELIVERY_HOST || !SUPPORT_EMAIL) {
  throw new Error('Environment variable configuration is required to test GovDeliveryService');
}

describe('GovDeliveryService', () => {
  let client: GovDeliveryService;
  let event;
  let user: User;

  const mockPost = jest.fn();
  mockPost.mockResolvedValue({
    data: {},
    headers: {},
    status: 200,
    statusText: 'ok',
  });
  jest.spyOn(axios, 'create').mockReturnValue({ post: mockPost } as unknown as AxiosInstance);

  beforeEach(() => {
    client = new GovDeliveryService({
      host: GOVDELIVERY_HOST,
      supportEmailRecipient: SUPPORT_EMAIL,
      token: GOVDELIVERY_KEY,
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
        oauth: false,
        token_issued: true,
      });
      expect(html).toEqual(expect.stringContaining('Welcome Edward'));
      expect(html).toEqual(expect.stringContaining('VA Facilities API'));
      expect(html).toEqual(expect.stringContaining('apiKey: fakeKey'));
    });

    it('should render the handlebars template with health and verification', () => {
      const template = client.welcomeTemplate;
      const html = template({
        apis: 'Health API, Veteran Verification API, and VA Facilities API',
        clientID: 'superid',
        clientSecret: 'supersecret',
        firstName: 'Edward',
        key: 'fakeKey',
        oauth: true,
        token_issued: true,
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
      expect(mockPost).toHaveBeenCalledWith(
        '/messages/email',
        expect.objectContaining({
          body: expect.stringContaining('VA Facilities API and Benefits Intake API') as unknown,
          recipients: [{ email: 'ed@adhocteam.us' }],
          subject: 'Welcome to the VA API Platform',
        }),
      );
    });

    it('should raise error if user lacks token and client_id', async () => {
      /*
       * Fail the test if the expectation in the catch is never
       * reached.
       */
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
        apis: ['facilities', 'benefits'],
        description: 'Need more supplies for second breakfast',
        firstName: 'Peregrin',
        lastName: 'Took',
        organization: 'The Fellowship of the Ring',
        requester: 'peregrin@thefellowship.org',
      };

      await client.sendConsumerSupportEmail(email);
      expect(mockPost).toHaveBeenCalledWith(
        '/messages/email',
        expect.objectContaining({
          body: expect.stringContaining('peregrin@thefellowship.org') as unknown,
          from_name: 'Peregrin Took',
          recipients: [{ email: SUPPORT_EMAIL }],
          subject: 'Support Needed',
        }),
      );
    });

    describe('sendPublishingSupportEmail', () => {
      it('should send a request', async () => {
        const email: PublishingSupportEmail = {
          apiDetails: 'Ring',
          apiInternalOnly: false,
          firstName: 'Peregrin',
          lastName: 'Took',
          organization: 'The Fellowship of the Ring',
          requester: 'peregrin@thefellowship.org',
        };

        await client.sendPublishingSupportEmail(email);
        expect(mockPost).toHaveBeenCalledWith(
          '/messages/email',
          expect.objectContaining({
            body: expect.stringContaining('API Details') as unknown,
            from_name: 'Peregrin Took',
            recipients: [{ email: SUPPORT_EMAIL }],
            subject: 'Publishing Support Needed',
          }),
        );
      });
    });

    describe('sendProductionAccessEmail', () => {
      it('should send a request', async () => {
        const email: ProductionAccessSupportEmail = {
          apis: 'benefits',
          appDescription: 'A social media platform with one room.',
          appImageLink: 'www.one2bindthem.com/assets/image',
          appName: 'One to Bind Them',
          breachManagementProcess: 'golem',
          businessModel: 'magical rings >> profit',
          centralizedBackendLog: 'non-existent',
          productionKeyCredentialStorage: 'stored in a volcano on mount doom',
          productionOrOAuthKeyCredentialStorage: 'also stored in a volcano',
          distributingAPIKeysToCustomers: false,
          exposeVeteranInformationToThirdParties: false, // eslint-disable-line id-length
          listedOnMyHealthApplication: false,
          medicalDisclaimerImageLink: 'www.one2bindthem.com/assets/disclaimer',
          monitizationExplanation: 'n/a',
          monitizedVeteranInformation: false,
          multipleReqSafeguards: 'golem',
          namingConvention: 'overly-complicated',
          organization: 'Sauron.INC',
          patientWaitTimeImageLink: 'www.one2bindthem.com/assets/patient',
          phoneNumber: '867-5309',
          piiStorageMethod: 'Locking away in the fires from whence it came.',
          platforms: 'iOS',
          policyDocuments: ['www.example.com/tos'],
          primaryContact: {
            email: 'sam@fellowship.com',
            firstName: 'Samwise',
            lastName: 'Gamgee',
          },
          scopesAccessRequested: ['profile', 'email'],
          secondaryContact: {
            email: 'frodo@fellowship.com',
            firstName: 'Frodo',
            lastName: 'Baggins',
          },
          signUpLink: 'www.one2bindthem.com/signup',
          statusUpdateEmails: ['sam@fellowship.com'],
          storePIIOrPHI: false,
          supportLink: 'www.one2bindthem.com/support',
          thirdPartyInfoDescription: 'n/a',
          valueProvided: 'n/a',
          vasiSystemName: 'asdf',
          veteranFacing: false,
          veteranFacingDescription:
            'Now the Elves made many rings; but secretly Sauron made One Ring to rule all the others, and their power was bound up with it, to be subject wholly to it and to last only so long as it too should last.',
          vulnerabilityManagement: 'golem',
        };
        await client.sendProductionAccessEmail(email);
        expect(mockPost).toHaveBeenCalledWith(
          '/messages/email',
          expect.objectContaining({
            body: expect.stringContaining('Primary Contact:') as unknown,
            from_name: 'Samwise Gamgee',
            recipients: [{ email: SUPPORT_EMAIL }],
            subject: 'Production Access Requested for Sauron.INC',
          }),
        );
      });
    });

    describe('sendProductionAccessConsumerEmail', () => {
      it('should send a request', async () => {
        const emails: string[] = ['ed@adhocteam.us'];
        await client.sendProductionAccessConsumerEmail(emails);
        expect(mockPost).toHaveBeenCalledWith(
          '/messages/email',
          expect.objectContaining({
            body: expect.stringContaining(
              'We’ve received your request for production access.',
            ) as unknown,
            recipients: [{ email: 'ed@adhocteam.us' }],
            subject: 'Your Request for Production Access is Submitted',
          }),
        );
      });
    });
  });

  describe('Healthcheck Validation', () => {
    it('returns true when healthcheck endpoint returns 200', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: [{}],
        headers: {},
        status: 200,
        statusText: 'ok',
      });

      // cast to unknown first to avoid having to reimplement all of AxiosInstance
      jest
        .spyOn(axios, 'create')
        .mockImplementation(() => ({ get: mockGet } as unknown as AxiosInstance));
      client = new GovDeliveryService({
        host: GOVDELIVERY_HOST,
        supportEmailRecipient: SUPPORT_EMAIL,
        token: GOVDELIVERY_KEY,
      });
      const res = await client.healthCheck();
      expect(res).toEqual({ healthy: true, serviceName: 'GovDelivery' });
    });

    it('returns false when healthcheck endpoint throws an error', async () => {
      const err = new Error(`ECONNREFUSED ${GOVDELIVERY_HOST}`);
      const mockGet = jest.fn().mockImplementation(() => {
        throw err;
      });

      // cast to unknown first to avoid having to reimplement all of AxiosInstance
      jest
        .spyOn(axios, 'create')
        .mockImplementation(() => ({ get: mockGet } as unknown as AxiosInstance));
      client = new GovDeliveryService({
        host: GOVDELIVERY_HOST,
        supportEmailRecipient: SUPPORT_EMAIL,
        token: GOVDELIVERY_KEY,
      });
      const res = await client.healthCheck();
      expect(res).toEqual({ err, healthy: false, serviceName: 'GovDelivery' });
      expect(res.err?.action).toEqual('checking health of GovDelivery');
    });
  });
});
