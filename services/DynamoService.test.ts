import 'jest';
import { AWSError, DynamoDB } from 'aws-sdk';
import DynamoService from './DynamoService';
import { DynamoConfig } from '../types';

describe("DynamoService", () => {
  let service: DynamoService;
  let mockPut: jest.SpyInstance;
  let mockScan: jest.SpyInstance;
  let mockQuery: jest.SpyInstance;
  let mockListTables: jest.SpyInstance;

  beforeEach(() => {
    const config = {
      httpOptions: {
        timeout: 5000,
      },
      maxRetries: 1,
      accessKeyId: process.env.DYNAMODB_ACCESS_KEY_ID,
      region: process.env.DYNAMODB_REGION,
      secretAccessKey: process.env.DYNAMODB_ACCESS_KEY_SECRET,
      sessionToken: process.env.DYNAMODB_SESSION_TOKEN,
    };
    service = new DynamoService(config as unknown as DynamoConfig);
    mockPut = jest.spyOn(service.client, 'put');
    mockScan = jest.spyOn(service.client, 'scan');
    mockQuery = jest.spyOn(service.client, 'query');
    mockListTables = jest.spyOn(service.dynamo, 'listTables');

    mockPut.mockClear();
    mockPut.mockImplementation((params, cb) => {
      // setTimeout to simulate actual async responses
      // because Dynamo client doesn't use Promises
      setTimeout(() => cb(null, [{}]), 5);
    });
    mockScan.mockClear();
    mockScan.mockImplementation((params, cb) => {
      setTimeout(() => cb(null, { Count: 1 }), 5);
    });

    mockQuery.mockClear();
    mockQuery.mockImplementation((params, cb) => {
      setTimeout(() => cb(null, [{}]), 5);
    });

    mockListTables.mockClear();
    mockListTables.mockImplementation((params, cb) => {
      setTimeout(() => cb(null, { TableNames: [ 'Users' ] }), 5);
    });
  });

  describe('constructor', () => {
    it('creates DynamoDB client', () => {
      expect(service.client).toBeInstanceOf(DynamoDB.DocumentClient);
    });
  });

  describe('putItem', () => {
    const item = { commonName: 'Treebeard', sidarinName: 'Fangorn', entishName: 'Not stored due to buffer overflow', orcishName: '' };
    const tableName = 'Ents';

    it('puts to a DynamoDB table', async () => { 
      await service.putItem(item, tableName);
      expect(mockPut).toHaveBeenCalledWith({ Item: item, TableName: tableName}, expect.any(Function));
    });

    // The DynamoDB API breaks if empty strings are passed in
    it('converts empty strings in user model to nulls', async () => {
      await service.putItem(item, tableName);
      expect(mockPut.mock.calls[0][0]['Item']['orcishName']).toEqual(null);
    });

    it('responds to an error with a rejection', async () => {
      //Fail the test if the expectation in the catch is never reached.
      expect.assertions(1);
      const err = 'Never is too long a word even for me . . . ';
      mockPut.mockImplementationOnce((params, cb) => setTimeout(() => cb(new Error(err)), 5));

      try {
        await service.putItem(item, tableName);
      } catch (err) {
        expect(err).toStrictEqual(err);
      }
    });

    it('resolves after inserting item', async () => {
      const resolve = await service.putItem(item, tableName);
      expect(resolve).toBeUndefined();
    });
  });

  describe('scan', () => {
    const tableName = 'Ents';
    const tableRecord = { 
      commonName: 'Treebeard',
      sidarinName: 'Fangorn',
      entishName: 'Not stored due to buffer overflow',
      orcishName: '',
    };
    const projectionExp = 'commonName, sidarinName, entishName, orcishName';
    const filterParams = {
      ExpressionAttributeValues: { 
        ':commonName': { S: 'Treebeard' },
      },
      FilterExpression: 'commonName = :commonName',
    };

    it('retrieves rows from the table', async () => {
      mockScan.mockImplementation((_, cb) => setTimeout(() => cb(null, { Items: [tableRecord] } ), 5));
      
      const result = await service.scan(tableName, projectionExp, filterParams);

      expect(result[0]).toEqual(tableRecord);
    });

    it('rejects when Dynamo returns and error', async () => {
      expect.assertions(1);

      const err = new Error('failed to retrieve from table') as AWSError;
      mockScan.mockImplementation((_, cb) => setTimeout(() => cb(err), 5));

      try {
        await service.scan(tableName, projectionExp, filterParams);
      } catch (err) {
        expect(err).toStrictEqual(err);
      }
    });
  });

  describe('query', () => {
    const tableName = 'Ents';
    const tableRecord = { 
      commonName: 'Treebeard',
      sidarinName: 'Fangorn',
      entishName: 'Not stored due to buffer overflow',
      orcishName: '',
    };
    const attributes =  { ':commonName': 'Treebeard' };
    const keyCondition = 'commonName = :commonName';

    it('retrieves rows from the table', async () => {
      mockQuery.mockImplementation((_, cb) => setTimeout(() => cb(null, { Items: [tableRecord] } ), 5));
      
      const result = await service.query(tableName, keyCondition, attributes);

      expect(result[0]).toEqual(tableRecord);
    });

    it('rejects when Dynamo returns and error', async () => {
      expect.assertions(1);

      const err = new Error('failed to retrieve from table') as AWSError;
      mockQuery.mockImplementation((_, cb) => setTimeout(() => cb(err), 5));

      try {
        await service.query(tableName, keyCondition, attributes);
      } catch (err) {
        expect(err).toStrictEqual(err);
      }
    });
  });

  describe('healthCheck', () => {
    it('scans a DynamoDB table', async () => {
      await service.healthCheck();
      expect(mockListTables).toHaveBeenCalledWith({ Limit:1 }, expect.any(Function));
    });

    it('returns unhealthy when it receives an error', async () => {
      const mockValue = 'Missing region in config';
      const err = new Error(`DynamoDB encountered an error: ${mockValue}`);
      const expectedReturn = { serviceName: 'Dynamo', healthy: false, err: err };
      mockListTables.mockImplementationOnce((params, cb) => {
        setTimeout(() => cb(new Error(mockValue)), 5);
      });

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toStrictEqual(expectedReturn);
    });

    it('returns unhealthy when it does not receive a properly formed response', async () => {
      const mockValue = {};
      const err = new Error(`DynamoDB encountered an error: Did not have a table: ${JSON.stringify(mockValue)}`);
      const expectedReturn = { serviceName: 'Dynamo', healthy: false, err: err };
      mockListTables.mockImplementation((params, cb) => {
        setTimeout(() => cb(null, mockValue), 5);
      });

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toStrictEqual(expectedReturn);
    });

    it('returns unhealthy when it does not contain a table', async () => {
      const mockValue = { Count: 0 };
      const err = new Error(`DynamoDB encountered an error: Did not have a table: ${JSON.stringify(mockValue)}`);
      const expectedReturn = { serviceName: 'Dynamo', healthy: false, err: err };
      mockListTables.mockImplementation((params, cb) => {
        setTimeout(() => cb(null, mockValue), 5);
      });

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toStrictEqual(expectedReturn);
    });

    it('returns healthy when it receives a single record', async () => {
      const expectedReturn = { serviceName: 'Dynamo', healthy: true };

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toStrictEqual(expectedReturn);
    });
  });
});
