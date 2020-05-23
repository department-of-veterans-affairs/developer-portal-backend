import { DynamoDB } from 'aws-sdk';
import 'jest';
import { FormSubmission } from '../types/FormSubmission';
import { OKTA_CONSUMER_APIS } from '../config/apis';
import User from './User';
import KongService from '../services/KongService';
import GovDeliveryService from '../services/GovDeliveryService';
import OktaService from '../services/OktaService';
import Application  from './Application';
import SlackService from '../services/SlackService';

const mockCreateOktaApplication = jest.fn();
jest.mock('./Application', () => {
  return jest.fn().mockImplementation(() => {
    return {
      createOktaApplication: mockCreateOktaApplication,
    };
  });
});

describe('User', () => {
  let event;
  let user: User;
  let originalDate;

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
      organization: 'Ad Hoc',
      termsOfService: true,
      oAuthRedirectURI: 'https://rohirrim.rohan.horse/auth',
      oAuthApplicationType: 'web',
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
    for (const api of OKTA_CONSUMER_APIS) {
      it(`returns true when ${api} is requested`, () => {
        event = {
          apis: api,
          description: 'Mayhem',
          email: 'ed@adhocteam.us',
          firstName: 'Edward',
          lastName: 'Paget',
          organization: 'Ad Hoc',
          termsOfService: true,
        };
        user = new User(event);
        expect(user.shouldUpdateOkta()).toBe(true);
      });
    }

    it('returns false when benefits / facilities are requested', () => {
      event = {
        apis: 'benefits,facilities',
        description: 'Mayhem',
        email: 'ed@adhocteam.us',
        firstName: 'Edward',
        lastName: 'Paget',
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
    it('uses dynamo put to save items', async () => {
      const client = new DynamoDB.DocumentClient();
      const mockPut = jest.spyOn(client, 'put');
      mockPut.mockImplementation((params, cb) => {
        cb(null, params);
      });

      const userResult = await user.saveToDynamo(client);
      expect(userResult).toEqual(user);
    });

    it('returns an error if save fails', async () => {
      const client = new DynamoDB.DocumentClient();
      const error = new Error('error');

      client.put = jest.fn((params, cb) => {
        cb(error, params);
      });
      try {
        await user.saveToDynamo(client);
      } catch (err) {
        expect(err).toEqual(error);
      }
    });

    // The DynamoDB API breaks if empty strings are passed in
    it('converts empty strings in user model to nulls', async () => {
      const client = new DynamoDB.DocumentClient();
      client.put = jest.fn((params, cb) => { cb(null, params); });

      const form: FormSubmission = {
        apis: 'benefits,verification',
        description: 'Mayhem',
        email: 'ed@adhocteam.us',
        firstName: 'Edward',
        lastName: 'Paget',
        organization: 'Ad Hoc',
        oAuthRedirectURI: '',
        oAuthApplicationType: '',
        termsOfService: true,
      };

      user = new User(form);
      await user.saveToDynamo(client);

      expect(client.put.mock.calls[0][0]['Item']['oAuthRedirectURI']).toEqual(null);
    });
  });

  describe('saveToKong', () => {
    const mockCreateConsumer = jest.fn();
    const mockKeyAuth = jest.fn();
    const mockCreateAcls = jest.fn().mockResolvedValue({});
    const kongService = {
      createConsumer: mockCreateConsumer,
      createACLs: mockCreateAcls,
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
      //Fail the test if the expectation in the catch is never
      //reached.
      expect.assertions(1);

      mockCreateConsumer.mockRejectedValue(new Error('failed calling Kong'));

      try {
        await user.saveToKong(kongService);
      } catch (err) {
        expect(err.action).toEqual('failed creating kong consumer');
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
      } catch (err) {
        expect(err).toEqual(testErr);
      }
    });
  });

  describe('sendToOkta', () => {
    const mockOkta = {} as OktaService;
    it('sends to Okta if a redirect URI is provided', async () => {
      await user.saveToOkta(mockOkta);
      expect(Application).toHaveBeenCalledWith({
        applicationType: 'web',
        name: `AdHocPaget-1892-01-03T08:00:00.000Z`,
        redirectURIs: ['https://rohirrim.rohan.horse/auth'],
      }, user);
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
      expect(mockSendSuccessMessage).toHaveBeenCalledWith(expectedSlackString, 'New User Application');
    });
  });

});
