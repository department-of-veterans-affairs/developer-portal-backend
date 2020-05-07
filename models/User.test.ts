import { DynamoDB } from 'aws-sdk';
import 'jest';
import { FormSubmission } from '../types/FormSubmission';
import User from './User';

describe('User', () => {
  let event;
  let user: User;

  beforeEach(() => {
    event = {
      apis: 'facilities,verification',
      description: 'Mayhem',
      email: 'ed@adhocteam.us',
      firstName: 'Edward',
      lastName: 'Paget',
      organization: 'Ad Hoc',
      termsOfService: true,
    };
    user = new User(event);
  });

  describe('constructor', () => {
    test('it should assign fields from the event object', () => {
      expect(user.firstName).toEqual('Edward');
      expect(user.lastName).toEqual('Paget');
      expect(user.apis).toEqual('facilities,verification');
      expect(user.description).toEqual('Mayhem');
      expect(user.email).toEqual('ed@adhocteam.us');
      expect(user.organization).toEqual('Ad Hoc');
    });
  });

  describe('shouldUpdateOkta', () => {
    const OKTA_CONSUMER_APIS = [
      'health',
      'verification',
      'communityCare',
      'claims',
    ];

    for (const api of OKTA_CONSUMER_APIS) {
      it(`should be true when ${api} is requested`, () => {
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

    it('should be false when benefits / facilities are requested', () => {
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
    it('should be true when facilities are requested', () => {
      expect(user.shouldUpdateKong()).toBe(true);
    });

    it('should be true when benefits are requested', () => {
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

    it('should be false otherwise', () => {
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
    test('it should return the org/lastname concated together', () => {
      user.createdAt = new Date(2018, 0, 23);
      expect(user.consumerName()).toEqual('AdHocPaget');
    });
  });

  describe.only('saveToDynamo', () => {
    test('it should use dynamo put to save items', async () => {
      const client = new DynamoDB.DocumentClient();
      const mockPut = jest.spyOn(client, 'put');
      mockPut.mockImplementation((params, cb) => {
        cb(null, params);
      });

      const userResult = await user.saveToDynamo(client);
      expect(userResult).toEqual(user);
    });

    test('it should return an error if save fails', async () => {
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
    test('it should convert empty strings in user model to nulls', async () => {
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

  describe('toSlackString', () => {
    test('it should generate a properly formatted message', () => {
      const user = new User({
        apis: 'benefits,verification,facilities,claims',
        description: 'Mayhem',
        email: 'ed@adhocteam.us',
        firstName: 'Edward',
        lastName: 'Paget',
        oAuthRedirectURI: 'http://localhost:4000',
        oAuthApplicationType: 'native',
        organization: 'Ad Hoc',
        termsOfService: true,
      });
      expect(user.toSlackString()).toEqual(
        'Paget, Edward: ed@adhocteam.us\nDescription: Mayhem\nRequested access to:\n* benefits\n* verification\n* facilities\n* claims\n',
      );
    });
  });
});
