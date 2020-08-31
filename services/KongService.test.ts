import 'jest';
import KongService from './KongService';
import User from '../models/User';
import { AxiosInstance } from 'axios';

describe("KongService", () => {
  let service: KongService;
  let client: AxiosInstance;
  let event;
  let user: User;
  const getMock = jest.fn().mockName('getMock');
  const postMock = jest.fn().mockName('postMock');
  beforeEach(() => {
    service = new KongService({
      apiKey: 'fakeKey',
      host: 'fakeHost',
      port: 8000,
    });

    client = service.getClient();
    service.getClient = (): AxiosInstance =>
      ({ get: getMock, post: postMock } as unknown as AxiosInstance);

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
      expect(client.defaults.baseURL).toMatch(/^https/);
    });
  });

  describe('createConsumer', () => {
    it('sends a request when the consumer does not exist', async () => {
      getMock.mockRejectedValue({});
      postMock.mockResolvedValue({ data: { username: 'AdHocPaget' } });

      const result = await service.createConsumer(user);

      expect(postMock).toHaveBeenCalledWith(
        "/internal/admin/consumers",
        { username: 'AdHocPaget' },
      );
      expect(result.username).toEqual('AdHocPaget');
    });

    it('does not create a new consumer when one already exists', async () => {
      getMock.mockResolvedValue({ data: { username: 'AdHocPaget' } });

      const result = await service.createConsumer(user);

      expect(postMock).not.toHaveBeenCalled();
      expect(result.username).toEqual('AdHocPaget');
    });
  });

  describe('createACLs', () => {
    it('adds groups', async () => {
      getMock.mockResolvedValue({ data: { data: [] } });

      const result = await service.createACLs(user);

      expect(postMock).toHaveBeenCalledWith(
        "/internal/admin/consumers/AdHocPaget/acls",
        { group: 'va_facilities' },
      );
      expect(postMock).toHaveBeenCalledWith(
        "/internal/admin/consumers/AdHocPaget/acls",
        { group: 'vba_documents' },
      );
      expect(result.total).toEqual(2);
    });

    it('does not add groups a consumer already belongs to', async () => {
      getMock.mockResolvedValue({ data: { data: [{ group: 'vba_documents' }] } });

      const result = await service.createACLs(user);

      expect(postMock).toHaveBeenCalledWith(
        "/internal/admin/consumers/AdHocPaget/acls",
        { group: 'va_facilities' },
      );
      expect(postMock).not.toHaveBeenCalledWith(
        "/internal/admin/consumers/AdHocPaget/acls",
        { group: 'vba_documents' },
      );
      expect(result.total).toEqual(1);
    });
  });

  describe('createKeyAuth', () => {
    it('sends a request', async () => {
      postMock.mockResolvedValue({ data: { key: 'fakekey' } });

      const result = await service.createKeyAuth(user);

      expect(postMock).toHaveBeenCalledWith("/internal/admin/consumers/AdHocPaget/key-auth");
      expect(result.key).toEqual('fakekey');
    });
  });

  describe('healthCheck', () => {
    it('sends a request', async () => {
      await service.healthCheck();
      expect(getMock).toHaveBeenCalledWith("/internal/admin/consumers/_internal_DeveloperPortal");
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
      getMock.mockResolvedValue({ data: getMockValue });

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toStrictEqual(expectedReturn);
    });

    it('returns unhealthy when it receives the wrong consumer', async () => {
      const getMockValue = { username: 'wrong_user' };
      const err = new Error(`Kong did not return the expected consumer: ${JSON.stringify(getMockValue)}`);
      const expectedReturn = { serviceName: 'Kong', healthy: false, err: err };
      getMock.mockResolvedValue({ data: { username: 'wrong_user' } });

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toStrictEqual(expectedReturn);
    });

    it('returns healthy when it receives the right consumer', async () => {
      const expectedReturn = { serviceName: 'Kong', healthy: true };
      getMock.mockResolvedValue({ data: { username: '_internal_DeveloperPortal' } });

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toStrictEqual(expectedReturn);
    });
  });
});
