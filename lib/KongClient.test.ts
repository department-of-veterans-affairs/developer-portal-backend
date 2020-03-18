import 'jest';
import { KongClient } from './KongClient';
import { User } from './models';
import * as request from 'request-promise-native';
jest.mock('request-promise-native', () => {
  return {
    get: jest.fn((_) => Promise.resolve({})),
    post: jest.fn((_) => Promise.resolve({}))
  }
});

describe("KongClient", () => {
  let client;
  let event;
  let user;

  beforeEach(() => {
    client = new KongClient({
      apiKey: 'fakeKey',
      host: 'fakeHost'
    });
    event = {
      apis: 'facilities,benefits',
      description: 'Mayhem',
      email: 'ed@adhocteam.us',
      firstName: 'Edward',
      lastName: 'Paget',
      organization: 'Ad Hoc',
      termsOfService: true,
    }
    user = new User(event);
    request.get.mockReset();
    request.post.mockReset();
  });

  describe('constructor', () => {
    test('it should set defaults', () => {
      expect(client.port).toEqual(8000);
      expect(client.protocol).toEqual('https');
    });
  });

  describe('createConsumer', () => {
    test('it should send a request when the consumer does not exist', async () => {
      request.get.mockImplementation(() => Promise.reject({}));
      await client.createConsumer(user)
      expect(request.post).toHaveBeenCalledWith({
        url: "https://fakeHost:8000/api_management/consumers",
        body: { username: 'AdHocPaget' },
        json: true,
        headers: { apiKey: 'fakeKey' }
      });
    });

    test('it should not send a request when the consumer does not exist', async () => {
      request.get.mockImplementation(() => Promise.resolve({data: { username: 'AdHocPaget' }}));
      await client.createConsumer(user)
      expect(request.post).not.toHaveBeenCalledWith({
        url: "https://fakeHost:8000/api_management/consumers",
        body: { username: 'AdHocPaget' },
        json: true,
        headers: { apiKey: 'fakeKey' }
      });
    });
 
  });

  describe('createACLs', () => {
    test('it should send a request', async () => {
      request.get.mockImplementation(() => Promise.resolve({data: []}));
      await client.createACLs(user)
      expect(request.post).toHaveBeenCalledWith({
        url: "https://fakeHost:8000/api_management/consumers/AdHocPaget/acls",
        body: { group: 'va_facilities' },
        json: true,
        headers: { apiKey: 'fakeKey' }
      });
      expect(request.post).toHaveBeenCalledWith({
        url: "https://fakeHost:8000/api_management/consumers/AdHocPaget/acls",
        body: { group: 'vba_documents' },
        json: true,
        headers: { apiKey: 'fakeKey' }
      });
    });

    test('it should not send a request for groups consumer already belongs to', async () => {
      request.get.mockImplementation(() => Promise.resolve({data: [{ group: 'vba_documents' }]}));
      await client.createACLs(user)
      expect(request.post).toHaveBeenCalledWith({
        url: "https://fakeHost:8000/api_management/consumers/AdHocPaget/acls",
        body: { group: 'va_facilities' },
        json: true,
        headers: { apiKey: 'fakeKey' }
      });
      expect(request.post).not.toHaveBeenCalledWith({
        url: "https://fakeHost:8000/api_management/consumers/AdHocPaget/acls",
        body: { group: 'vba_documents' },
        json: true,
        headers: { apiKey: 'fakeKey' }
      });
    });
  });

  describe('createKeyAuth', () => {
    test('it should send a request', async () => {
      await client.createKeyAuth(user)
      expect(request.post).toHaveBeenCalledWith({
        url: "https://fakeHost:8000/api_management/consumers/AdHocPaget/key-auth",
        json: true,
        headers: { apiKey: 'fakeKey' }
      });
    });
  });
});
