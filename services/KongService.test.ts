import 'jest';
import KongService from './KongService';
import User from '../models/User';
import request from 'request-promise-native';

describe("KongService", () => {
  let client: KongService;
  let event;
  let user: User;
  let getMock: jest.SpyInstance;
  let postMock: jest.SpyInstance;

  beforeEach(() => {
    client = new KongService({
      apiKey: 'fakeKey',
      host: 'fakeHost',
      port: 8000
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

    getMock = jest.spyOn(request, 'get').mockResolvedValue({});
    postMock = jest.spyOn(request, 'post').mockResolvedValue({});

    // mockReset leaves the mocked implementation, but clears information about
    // the previous runs.
    getMock.mockReset();
    postMock.mockReset();
  });

  describe('constructor', () => {
    it('should set defaults', () => {
      expect(client.protocol).toEqual('https');
    });
  });

  describe('createConsumer', () => {
    it('should send a request when the consumer does not exist', async () => {
      getMock.mockImplementation(() => Promise.reject({}));
      await client.createConsumer(user);
      expect(postMock).toHaveBeenCalledWith({
        url: "https://fakeHost:8000/internal/admin/consumers",
        body: { username: 'AdHocPaget' },
        json: true,
        headers: { apiKey: 'fakeKey' }
      });
    });

    it('should not send a request when the consumer does not exist', async () => {
      getMock.mockImplementation(() => Promise.resolve({data: { username: 'AdHocPaget' }}));
      await client.createConsumer(user);
      expect(postMock).not.toHaveBeenCalledWith({
        url: "https://fakeHost:8000/internal/admin/consumers",
        body: { username: 'AdHocPaget' },
        json: true,
        headers: { apiKey: 'fakeKey' }
      });
    });
 
  });

  describe('createACLs', () => {
    it('should send a request', async () => {
      getMock.mockImplementation(() => Promise.resolve({data: []}));
      await client.createACLs(user);
      expect(postMock).toHaveBeenCalledWith({
        url: "https://fakeHost:8000/internal/admin/consumers/AdHocPaget/acls",
        body: { group: 'va_facilities' },
        json: true,
        headers: { apiKey: 'fakeKey' }
      });
      expect(postMock).toHaveBeenCalledWith({
        url: "https://fakeHost:8000/internal/admin/consumers/AdHocPaget/acls",
        body: { group: 'vba_documents' },
        json: true,
        headers: { apiKey: 'fakeKey' }
      });
    });

    it('should not send a request for groups consumer already belongs to', async () => {
      getMock.mockImplementation(() => Promise.resolve({data: [{ group: 'vba_documents' }]}));
      await client.createACLs(user);
      expect(postMock).toHaveBeenCalledWith({
        url: "https://fakeHost:8000/internal/admin/consumers/AdHocPaget/acls",
        body: { group: 'va_facilities' },
        json: true,
        headers: { apiKey: 'fakeKey' }
      });
      expect(postMock).not.toHaveBeenCalledWith({
        url: "https://fakeHost:8000/internal/admin/consumers/AdHocPaget/acls",
        body: { group: 'vba_documents' },
        json: true,
        headers: { apiKey: 'fakeKey' }
      });
    });
  });

  describe('createKeyAuth', () => {
    it('should send a request', async () => {
      await client.createKeyAuth(user);
      expect(postMock).toHaveBeenCalledWith({
        url: "https://fakeHost:8000/internal/admin/consumers/AdHocPaget/key-auth",
        json: true,
        headers: { apiKey: 'fakeKey' }
      });
    });
  });
});
