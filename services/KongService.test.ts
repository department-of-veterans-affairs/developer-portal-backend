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
    it('sends a request when the consumer does not exist', async () => {
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

    it('does not create a new consumer when one already exists', async () => {
      getMock.mockResolvedValue({ username: 'AdHocPaget' });

      const result = await service.createConsumer(user);

      expect(postMock).not.toHaveBeenCalled();
      expect(result.username).toEqual('AdHocPaget');
    });
  });

  describe('createACLs', () => {
    it('adds groups', async () => {
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

    it('does not add groups a consumer already belongs to', async () => {
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
    it('sends a request', async () => {
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
    it('sends a request', async () => {
      await service.healthCheck();
      expect(getMock).toHaveBeenCalledWith({
        url: "https://fakeHost:8000/internal/admin/consumers/_internal_DeveloperPortal",
        json: true,
        headers: { apiKey: 'fakeKey' }
      });
    });

    it('returns unhealthy when it catches an error', async () => {
      const err = new Error('failed to connect to Kong');
      const expectedReturn = { serviceName: 'Kong', healthy: false, err: err };
      getMock.mockRejectedValue(err);

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toStrictEqual(expectedReturn);
    });

    it('returns unhealthy when it does not receive a KongConsumerResponse', async () => {
      const getMockValue = { message: 'Not found' };
      const err = new Error(`Kong did not return the expected consumer: ${JSON.stringify(getMockValue)}`);
      const expectedReturn = { serviceName: 'Kong', healthy: false, err: err };
      getMock.mockResolvedValue(getMockValue);

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toStrictEqual(expectedReturn);
    });

    it('returns unhealthy when it receives the wrong consumer', async () => {
      const getMockValue = { username: 'wrong_user' };
      const err = new Error(`Kong did not return the expected consumer: ${JSON.stringify(getMockValue)}`);
      const expectedReturn = { serviceName: 'Kong', healthy: false, err: err };
      getMock.mockResolvedValue({ username: 'wrong_user' });

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toStrictEqual(expectedReturn);
    });

    it('returns healthy when it receives the right consumer', async () => {
      const expectedReturn = { serviceName: 'Kong', healthy: true };
      getMock.mockResolvedValue({ username: '_internal_DeveloperPortal' });

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toStrictEqual(expectedReturn);
    });
  });
});
