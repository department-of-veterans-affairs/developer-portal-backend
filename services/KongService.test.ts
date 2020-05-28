import 'jest';
import KongService from './KongService';
import User from '../models/User';
import request from 'request-promise-native';

describe("KongService", () => {
  let service: KongService;
  let event;
  let user: User;
  const getMock = jest.spyOn(request, 'get').mockResolvedValue({});
  const postMock = jest.spyOn(request, 'post').mockResolvedValue({});

  beforeEach(() => {
    service = new KongService({
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

    getMock.mockClear();
    postMock.mockClear();
  });

  describe('constructor', () => {
    it('should set defaults', () => {
      expect(service.protocol).toEqual('https');
    });
  });

  describe('createConsumer', () => {
    it('should send a request when the consumer does not exist', async () => {
      getMock.mockRejectedValue({});
      postMock.mockResolvedValue({ username: 'AdHocPaget' });

      const result = await service.createConsumer(user);
      
      expect(postMock).toHaveBeenCalledWith({
        url: "https://fakeHost:8000/internal/admin/consumers",
        body: { username: 'AdHocPaget' },
        json: true,
        headers: { apiKey: 'fakeKey' }
      });
      expect(result.username).toEqual('AdHocPaget');
    });

    it('should not create a new consumer when one already exists', async () => {
      getMock.mockResolvedValue({ username: 'AdHocPaget' });

      const result = await service.createConsumer(user);

      expect(postMock).not.toHaveBeenCalled();
      expect(result.username).toEqual('AdHocPaget');
    });
  });

  describe('createACLs', () => {
    it('should add groups', async () => {
      getMock.mockResolvedValue({data: []});

      const result = await service.createACLs(user);
      
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
      expect(result.total).toEqual(2);
    });

    it('should not add groups a consumer already belongs to', async () => {
      getMock.mockResolvedValue({data: [{ group: 'vba_documents' }]});

      const result = await service.createACLs(user);
      
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
      expect(result.total).toEqual(1);
    });
  });

  describe('createKeyAuth', () => {
    it('should send a request', async () => {
      postMock.mockResolvedValue({ key: 'fakekey' });

      const result = await service.createKeyAuth(user);

      expect(postMock).toHaveBeenCalledWith({
        url: "https://fakeHost:8000/internal/admin/consumers/AdHocPaget/key-auth",
        json: true,
        headers: { apiKey: 'fakeKey' }
      });
      expect(result.key).toEqual('fakekey');
    });
  });

  describe('healthCheck', () => {
    it('should send a request', async () => {
      await service.healthCheck();
      expect(getMock).toHaveBeenCalledWith({
        url: "https://fakeHost:8000/internal/admin/consumers",
        json: true,
        headers: { apiKey: 'fakeKey' }
      });
    });

    it('should return false when it does not receive a data array', async () => {
      getMock.mockResolvedValue({});

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toBe(false);
    });

    it('should return false when it receives an empty data array', async () => {
      getMock.mockResolvedValue({data: []});

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toBe(false);
    });

    it('should return true when it receives a data array with elements', async () => {
      getMock.mockResolvedValue({data: [{}]});

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toBe(true);
    });
  });
});
