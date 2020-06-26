import 'jest';
import { DynamoDB } from 'aws-sdk';
import DynamoService from './DynamoService';

describe("DynamoService", () => {
  let service: DynamoService;
  let mockScan: jest.SpyInstance;

  beforeEach(() => {
    service = new DynamoService({
      httpOptions: {
        timeout: 5000,
      },
      maxRetries: 1,
    });
    mockScan = jest.spyOn(service.client, 'scan');

    mockScan.mockClear();
    mockScan.mockImplementation((params, cb) => {
      cb(null, [{}]);
    });
  });

  describe('constructor', () => {
    it('creates DynamoDB client', () => {
      expect(service.client).toBeInstanceOf(DynamoDB.DocumentClient);
    });
  });

  describe('healthCheck', () => {
    it('scans a DynamoDB table', async () => {
      await service.healthCheck();
      expect(mockScan).toHaveBeenCalledWith({ Limit:1, TableName: 'Users'}, expect.any(Function));
    });

    it('returns unhealthy when it does not receive a record', async () => {
      const mockValue = 'Missing region in config';
      const err = new Error(`DynamoDB did not return a record: ${mockValue}`);
      const expectedReturn = { serviceName: 'Dynamo', healthy: false, err: err };
      mockScan.mockImplementationOnce((params, cb) => {
        cb(new Error(mockValue));
      });

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toStrictEqual(expectedReturn);
    });

    it('returns healthy when it receives a record', async () => {
      const expectedReturn = { serviceName: 'Dynamo', healthy: true };

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toStrictEqual(expectedReturn);
    });
  });
});
