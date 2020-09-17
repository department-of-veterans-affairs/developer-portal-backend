import 'jest';
import { AWSError, DynamoDB } from 'aws-sdk';
import { ScanInput } from 'aws-sdk/clients/dynamodb';
import DynamoService from './DynamoService';

describe("DynamoService", () => {
  let service: DynamoService;
  let mockPut: jest.SpyInstance;
  let mockScan: jest.SpyInstance;
  let mockQuery: jest.SpyInstance;

  beforeEach(() => {
    service = new DynamoService({
      httpOptions: {
        timeout: 5000,
      },
      maxRetries: 1,
    });
    mockPut = jest.spyOn(service.client, 'put');
    mockScan = jest.spyOn(service.client, 'scan');
    mockQuery = jest.spyOn(service.client, 'query');

    mockPut.mockClear();
    mockPut.mockImplementation((params, cb) => {
      cb(null, [{}]);
    });
    mockScan.mockClear();
    mockScan.mockImplementation((params, cb) => {
      cb(null, { Count: 1 });
    });

    mockQuery.mockClear();
    mockQuery.mockImplementation((params, cb) => {
      cb(null, [{}]);
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
      mockPut.mockImplementationOnce((params, cb) => {
        cb(new Error(err));
      });

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
      mockScan.mockImplementation((_, cb) => { cb(null, { Items: [tableRecord] } ); });
      
      const result = await service.scan(tableName, projectionExp, filterParams);

      expect(result[0]).toEqual(tableRecord);
    });

    it('rejects when Dynamo returns and error', async () => {
      expect.assertions(1);

      const err = new Error('failed to retrieve from table') as AWSError;
      mockScan.mockImplementation((_, cb) => { cb(err); });

      try {
        await service.scan(tableName, projectionExp, filterParams);
      } catch (err) {
        expect(err).toStrictEqual(err);
      }
    });
  });

  describe('hardScan', () => {
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
      mockScan.mockImplementation((_, cb) => { cb(null, { Items: [tableRecord] } ); });
      
      const params: ScanInput = {
        TableName: tableName,
        ProjectionExpression: projectionExp,
        ...filterParams,
      };
      const result = await service.hardScan(params);

      expect(result[0]).toEqual(tableRecord);
    });

    it('rejects when Dynamo returns and error', async () => {
      expect.assertions(1);

      const err = new Error('failed to retrieve from table') as AWSError;
      mockScan.mockImplementation((_, cb) => { cb(err); });

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
      mockQuery.mockImplementation((_, cb) => { cb(null, { Items: [tableRecord] } ); });
      
      const result = await service.query(tableName, keyCondition, attributes);

      expect(result[0]).toEqual(tableRecord);
    });

    it('rejects when Dynamo returns and error', async () => {
      expect.assertions(1);

      const err = new Error('failed to retrieve from table') as AWSError;
      mockQuery.mockImplementation((_, cb) => { cb(err); });

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
      expect(mockScan).toHaveBeenCalledWith({ Limit:1, TableName: 'Users'}, expect.any(Function));
    });

    it('returns unhealthy when it receives an error', async () => {
      const mockValue = 'Missing region in config';
      const err = new Error(`DynamoDB encountered an error: ${mockValue}`);
      const expectedReturn = { serviceName: 'Dynamo', healthy: false, err: err };
      mockScan.mockImplementationOnce((params, cb) => {
        cb(new Error(mockValue));
      });

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toStrictEqual(expectedReturn);
    });

    it('returns unhealthy when it does not receive a properly formed response', async () => {
      const mockValue = {};
      const err = new Error(`DynamoDB did not return a record: ${JSON.stringify(mockValue)}`);
      const expectedReturn = { serviceName: 'Dynamo', healthy: false, err: err };
      mockScan.mockImplementation((params, cb) => {
        cb(null, mockValue);
      });

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toStrictEqual(expectedReturn);
    });

    it('returns unhealthy when it does not receive a single record', async () => {
      const mockValue = { Count: 0 };
      const err = new Error(`DynamoDB did not return a record: ${JSON.stringify(mockValue)}`);
      const expectedReturn = { serviceName: 'Dynamo', healthy: false, err: err };
      mockScan.mockImplementation((params, cb) => {
        cb(null, mockValue);
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
