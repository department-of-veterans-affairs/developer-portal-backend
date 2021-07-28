import 'jest';
import { PutItemInput, PutItemOutput } from 'aws-sdk/clients/dynamodb';
import { AWSError } from 'aws-sdk';
import { FormSubmission } from '../types/FormSubmission';
import { OKTA_CONSUMER_APIS } from '../config/apis';
import KongService from '../services/KongService';
import GovDeliveryService from '../services/GovDeliveryService';
import OktaService from '../services/OktaService';
import SlackService from '../services/SlackService';
import DynamoService from '../services/DynamoService';
import Application from './Application';
import User, { UserConfig } from './User';
import { DevPortalError } from './DevPortalError';

const mockCreateOktaApplication = jest.fn();
jest.mock('./Application', () =>
  jest.fn().mockImplementation(() => ({
    createOktaApplication: mockCreateOktaApplication,
  })),
);

describe('User', () => {
  let event: UserConfig;
  let user: User;
  let originalDate: () => number;

  beforeAll(() => {
    originalDate = Date.now;
    Date.now = jest.fn().mockReturnValue(-2461248000000);
  });

  afterAll(() => {
    Date.now = originalDate;
  });

  beforeEach(() => {
    event = {
      apis: 'facilities,verification',
      description: 'Mayhem',
      email: 'ed@adhocteam.us',
      firstName: 'Edward',
      lastName: 'Paget',
      oAuthApplicationType: 'web',
      oAuthRedirectURI: 'https://rohirrim.rohan.horse/auth',
      organization: 'Ad Hoc',
      termsOfService: true,
    };
    user = new User(event);
  });

  describe('constructor', () => {
    it('assigns fields from the event object', () => {
      expect(user.firstName).toEqual('Edward');
      expect(user.lastName).toEqual('Paget');
      expect(user.apis).toEqual('facilities,verification');
      expect(user.description).toEqual('Mayhem');
      expect(user.email).toEqual('ed@adhocteam.us');
      expect(user.organization).toEqual('Ad Hoc');
    });
  });

  describe('shouldUpdateOkta', () => {
    const updateOktaTest = (api: string): void => {
      event = {
        apis: api,
        description: 'Mayhem',
        email: 'ed@adhocteam.us',
        firstName: 'Edward',
        lastName: 'Paget',
        oAuthRedirectURI: '',
        organization: 'Ad Hoc',
        termsOfService: true,
      };
      user = new User(event);
      expect(user.shouldUpdateOkta()).toBe(true);
    };

    for (const api of OKTA_CONSUMER_APIS) {
      it(`returns true when ${api} is requested`, () => updateOktaTest(api));
    }

    it('returns false when benefits / facilities are requested', () => {
      event = {
        apis: 'benefits,facilities',
        description: 'Mayhem',
        email: 'ed@adhocteam.us',
        firstName: 'Edward',
        lastName: 'Paget',
        oAuthRedirectURI: '',
        organization: 'Ad Hoc',
        termsOfService: true,
      };
      user = new User(event);
      expect(user.shouldUpdateOkta()).toBe(false);
    });
  });

  describe('shouldUpdateKong', () => {
    it('returns true when facilities are requested', () => {
      expect(user.shouldUpdateKong()).toBe(true);
    });

    it('returns true when benefits are requested', () => {
      event = {
        apis: 'benefits,verification',
        description: 'Mayhem',
        email: 'ed@adhocteam.us',
        firstName: 'Edward',
        lastName: 'Paget',
        oAuthRedirectURI: '',
        organization: 'Ad Hoc',
        termsOfService: true,
      };
      user = new User(event);
      expect(user.shouldUpdateKong()).toBe(true);
    });

    it('returns false otherwise', () => {
      event = {
        apis: 'verification,health,claims,communityCare',
        description: 'Mayhem',
        email: 'ed@adhocteam.us',
        firstName: 'Edward',
        lastName: 'Paget',
        oAuthRedirectURI: '',
        organization: 'Ad Hoc',
        termsOfService: true,
      };
      user = new User(event);
      expect(user.shouldUpdateKong()).toBe(false);
    });
  });

  describe('consumerName', () => {
    it('returns the org/lastname concated together', () => {
      user.createdAt = new Date(2018, 0, 23);
      expect(user.consumerName()).toEqual('AdHocPaget');
    });
  });

  describe('saveToDynamo', () => {
    const mockPutItem = jest.fn<
      void,
      [params: PutItemInput, callback?: (err: AWSError, data: PutItemOutput) => void]
    >();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    mockPutItem.mockImplementation(() => {});
    const dynamo = { putItem: mockPutItem } as unknown as DynamoService;
    let form: FormSubmission;

    beforeEach(() => {
      mockPutItem.mockReset();

      form = {
        apis: 'benefits',
        description: 'Getting benefits for the Rohirrim',
        email: 'eomer@rohirrim.rohan.horse',
        firstName: 'Eomer',
        lastName: 'King',
        oAuthApplicationType: '',
        oAuthRedirectURI: '',
        organization: 'The Rohirrim',
        termsOfService: true,
      };
    });

    it('uses dynamo put to save items', async () => {
      const userResult = await user.saveToDynamo(dynamo);

      expect(userResult).toEqual(user);
    });

    it('returns an error if save fails', async () => {
      // Fail the test if the expectations in the catch is never reached.
      expect.assertions(2);
      const error = new Error('Where is the Horse and the Rider?');
      mockPutItem.mockImplementationOnce(() => {
        throw error;
      });

      try {
        await user.saveToDynamo(dynamo);
      } catch (err: unknown) {
        expect(err).toEqual(error);
        expect((err as DevPortalError).action).toEqual('failed saving to dynamo');
      }
    });

    it('saves client ids and secrets if they exist', async () => {
      const newUser = new User(form);
      newUser.oauthApplication = {
        client_id: 'xyz456',
        oktaID: 'abc123',
      } as unknown as Application;

      await newUser.saveToDynamo(dynamo);

      expect(mockPutItem.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          okta_application_id: {
            S: 'abc123',
          },
          okta_client_id: {
            S: 'xyz456',
          },
        }),
      );
    });

    it('avoids saving okta ids if they do not exist', async () => {
      const newUser = new User(form);

      await newUser.saveToDynamo(dynamo);

      const calledParams = Object.keys(mockPutItem.mock.calls[0][0]);
      expect(calledParams).not.toContain('okta_application_id');
      expect(calledParams).not.toContain('okta_client_id');
    });
  });

  describe('saveToKong', () => {
    const mockCreateConsumer = jest.fn();
    const mockKeyAuth = jest.fn();
    const mockCreateAcls = jest.fn().mockResolvedValue({});
    const kongService = {
      createACLs: mockCreateAcls,
      createConsumer: mockCreateConsumer,
      createKeyAuth: mockKeyAuth,
    } as unknown as KongService;

    beforeEach(() => {
      mockCreateAcls.mockReset();
      mockKeyAuth.mockReset();
      mockCreateConsumer.mockReset();
    });

    it('sets a consumer id and token from kong on the user', async () => {
      mockCreateConsumer.mockResolvedValue({ id: 'lonelymountainsmaug' });
      mockKeyAuth.mockResolvedValue({ key: 'onering' });

      await user.saveToKong(kongService);

      expect(mockCreateAcls).toHaveBeenCalled();
      expect(user.kongConsumerId).toEqual('lonelymountainsmaug');
      expect(user.token).toEqual('onering');
    });

    it('tags any errors that occur', async () => {
      /*
       * Fail the test if the expectation in the catch is never
       * reached.
       */
      expect.assertions(1);

      mockCreateConsumer.mockRejectedValue(new Error('failed calling Kong'));

      try {
        await user.saveToKong(kongService);
      } catch (err: unknown) {
        expect((err as DevPortalError).action).toEqual('failed creating kong consumer');
      }
    });
  });

  describe('sendEmail', () => {
    const mockSendWelcomeEmail = jest.fn();
    const govDelivery = { sendWelcomeEmail: mockSendWelcomeEmail } as unknown as GovDeliveryService;

    beforeEach(() => {
      mockSendWelcomeEmail.mockReset();
    });

    it('sends an email to the provided service', async () => {
      await user.sendEmail(govDelivery);
      expect(mockSendWelcomeEmail).toHaveBeenCalled();
    });

    it('tags any errors', async () => {
      expect.assertions(1);
      const testErr = new Error('failed calling GovDelivery');
      mockSendWelcomeEmail.mockRejectedValue(testErr);

      try {
        await user.sendEmail(govDelivery);
      } catch (err: unknown) {
        expect(err).toEqual(testErr);
      }
    });
  });

  describe('sendToOkta', () => {
    const mockOkta = {} as OktaService;
    it('sends to Okta if a redirect URI is provided', async () => {
      await user.saveToOkta(mockOkta);
      expect(Application).toHaveBeenCalledWith(
        {
          applicationType: 'web',
          name: 'AdHocPaget-1892-01-03T08:00:00.000Z',
          redirectURIs: ['https://rohirrim.rohan.horse/auth'],
        },
        user,
      );
      expect(mockCreateOktaApplication).toHaveBeenCalled();
    });
  });

  describe('sendSlackSuccess', () => {
    const mockSendSuccessMessage = jest.fn();

    const mockSlack = {
      sendSuccessMessage: mockSendSuccessMessage,
    } as unknown as SlackService;

    it('sends a message to Slack', async () => {
      const expectedSlackString = `Paget, Edward: ed@adhocteam.us
Description: Mayhem
Requested access to:
* facilities
* verification
`;
      await user.sendSlackSuccess(mockSlack);
      expect(mockSendSuccessMessage).toHaveBeenCalledWith(
        expectedSlackString,
        'New User Application',
      );
    });
  });
});
