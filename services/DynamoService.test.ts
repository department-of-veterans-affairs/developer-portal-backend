import 'jest';
import { AWSError, DynamoDB, Request as AWSRequest } from 'aws-sdk';
import DynamoService from './DynamoService';
import { DynamoConfig } from '../types';
import {
  AttributeMap,
  ListTablesOutput,
  PutItemInput,
  PutItemOutput,
  QueryOutput,
  ScanOutput,
} from 'aws-sdk/clients/dynamodb';

describe("DynamoService", () => {
  let service: DynamoService;
  // This needs typed in order for mockPut.mock.calls[0][0] not to give type warnings
  let mockPut: jest.SpyInstance<AWSRequest<PutItemOutput, AWSError>, [params: PutItemInput, callback?: (err: AWSError, data: PutItemOutput) => void]>;
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
    mockPut.mockImplementation((
      _params,
      cb?: (err: AWSError, data: PutItemOutput) => void,
    ) => {
      /**
       * what is going on here?
       * - use setTimeout to simulate actual async responses because Dynamo client doesn't use Promises
       * - the callback is always defined in the service but need to check presence for AWS typing
       * - because the first parameter of the callback is defined as AWSError and not AWSError | undefined
       * or AWSError | null, we cast null to AWSError so we have a falsy value that fits the typing. do
       * they actually call the callback with an error object always? presumably no. is this bad? I 
       * don't know. probably yes.
       */
      setTimeout(() => cb && cb(null as AWSError, {}), 5);
      return ({} as AWSRequest<PutItemOutput, AWSError>);
    });
    mockScan.mockClear();
    mockScan.mockImplementation((
      _params,
      cb: (error: AWSError | null, data: ScanOutput) => void,
    ) => {
      setTimeout(() => cb(null, { Count: 1 }), 5);
    });

    mockQuery.mockClear();
    mockQuery.mockImplementation((
      _params,
      cb: (error: AWSError | null, data: QueryOutput) => void,
    ) => {
      setTimeout(() => cb(null, {}), 5);
    });

    mockListTables.mockClear();
    mockListTables.mockImplementation((
      _params,
      cb: (err: AWSError | null, data: ListTablesOutput) => void,
    ) => {
      setTimeout(() => cb(null, { TableNames: ['Users'] }), 5);
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
      expect(mockPut).toHaveBeenCalledWith({ Item: item, TableName: tableName }, expect.any(Function));
    });

    // The DynamoDB API breaks if empty strings are passed in
    it('converts empty strings in user model to nulls', async () => {
      await service.putItem(item, tableName);
      expect(mockPut.mock.calls[0][0]['Item']['orcishName']).toEqual(null);
    });

    it('responds to an error with a rejection', async () => {
      //Fail the test if the expectation in the catch is never reached.
      expect.assertions(1);
      const err = new Error('Never is too long a word even for me . . . ') as AWSError;
      mockPut.mockImplementationOnce((
        _params,
        cb?: (err: AWSError, _data) => void,
      ) => {
        setTimeout(() => cb && cb(err, undefined), 5);
        return ({} as AWSRequest<PutItemOutput, AWSError>);
      });

      try {
        await service.putItem(item, tableName);
      } catch (putError) {
        expect(putError).toStrictEqual(err);
      }
    });

    it('resolves after inserting item', async () => {
      const resolve = await service.putItem(item, tableName);
      expect(resolve).toBeUndefined();
    });
  });

  describe('scan', () => {
    const tableName = 'Ents';
    const tableRecord: AttributeMap = {
      commonName: { S: 'Treebeard' },
      sidarinName: { S: 'Fangorn' },
      entishName: { S: 'Not stored due to buffer overflow' },
      orcishName: { S: '' },
    };
    const projectionExp = 'commonName, sidarinName, entishName, orcishName';
    const filterParams = {
      ExpressionAttributeValues: {
        ':commonName': { S: 'Treebeard' },
      },
      FilterExpression: 'commonName = :commonName',
    };

    it('retrieves rows from the table', async () => {
      mockScan.mockImplementation((
        _params,
        cb: (err: AWSError | null, data: ScanOutput) => void,
      ) => setTimeout(() => cb(null, { Items: [tableRecord] }), 5));

      const result = await service.scan(tableName, projectionExp, filterParams);

      expect(result[0]).toEqual(tableRecord);
    });

    it('rejects when Dynamo returns and error', async () => {
      expect.assertions(1);

      const err = new Error('failed to retrieve from table') as AWSError;
      mockScan.mockImplementation((
        _params,
        cb: (err: AWSError) => void,
      ) => setTimeout(() => cb(err), 5));

      try {
        await service.scan(tableName, projectionExp, filterParams);
      } catch (err) {
        expect(err).toStrictEqual(err);
      }
    });
  });

  describe('query', () => {
    const tableName = 'Ents';
    const tableRecord: AttributeMap = {
      commonName: { S: 'Treebeard' },
      sidarinName: { S: 'Fangorn' },
      entishName: { S: 'Not stored due to buffer overflow' },
      orcishName: { S: '' },
    };
    const attributes = { ':commonName': 'Treebeard' };
    const keyCondition = 'commonName = :commonName';

    it('retrieves rows from the table', async () => {
      mockQuery.mockImplementation((
        _params,
        cb: (err: AWSError | null, data: QueryOutput) => void,
      ) => setTimeout(() => cb(null, { Items: [tableRecord] }), 5));

      const result = await service.query(tableName, keyCondition, attributes);

      expect(result[0]).toEqual(tableRecord);
    });

    it('rejects when Dynamo returns and error', async () => {
      expect.assertions(1);

      const err = new Error('failed to retrieve from table') as AWSError;
      mockQuery.mockImplementation((
        _params,
        cb: (err: AWSError | null) => void,
      ) => setTimeout(() => cb(err), 5));

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
      expect(mockListTables).toHaveBeenCalledWith({ Limit: 1 }, expect.any(Function));
    });

    it('returns unhealthy when it receives an error', async () => {
      const mockValue = 'Missing region in config';
      const err = new Error(`DynamoDB encountered an error: ${mockValue}`);
      const expectedReturn = { serviceName: 'Dynamo', healthy: false, err: err };
      mockListTables.mockImplementationOnce((
        _params,
        cb: (err: AWSError) => void
      ) => {
        setTimeout(() => cb(new Error(mockValue) as AWSError), 5);
      });

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toStrictEqual(expectedReturn);
    });

    it('returns unhealthy when it does not receive a properly formed response', async () => {
      const mockValue = {};
      const err = new Error(`DynamoDB encountered an error: Did not have a table: ${JSON.stringify(mockValue)}`);
      const expectedReturn = { serviceName: 'Dynamo', healthy: false, err: err };
      mockListTables.mockImplementation((
        _params,
        cb: (err: AWSError | null, data: ListTablesOutput) => void,
      ) => {
        setTimeout(() => cb(null, mockValue), 5);
      });

      const healthCheck = await service.healthCheck();
      expect(healthCheck).toStrictEqual(expectedReturn);
    });

    it('returns unhealthy when it does not contain a table', async () => {
      const mockValue: ListTablesOutput = { TableNames: [] };
      const err = new Error(`DynamoDB encountered an error: Did not have a table: ${JSON.stringify(mockValue)}`);
      const expectedReturn = { serviceName: 'Dynamo', healthy: false, err: err };
      mockListTables.mockImplementation((
        _params,
        cb: (err: AWSError | null, data: ListTablesOutput) => void,
      ) => {
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
