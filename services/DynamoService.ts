import { AWSError, DynamoDB } from 'aws-sdk';
import { ScanInput, ScanOutput, QueryOutput } from 'aws-sdk/clients/dynamodb';
import { AttributeMap } from 'aws-sdk/clients/dynamodbstreams';
import { DynamoConfig, MonitoredService, ServiceHealthCheckResponse } from '../types';
import { DevPortalError } from '../models/DevPortalError';

export type FilterParams = Pick<ScanInput, 'ExpressionAttributeValues' | 'FilterExpression'>;

export default class DynamoService implements MonitoredService {
  public client: DynamoDB.DocumentClient;

  public dynamo: DynamoDB;

  public constructor(config: DynamoConfig) {
    this.dynamo = new DynamoDB(config);
    this.client = new DynamoDB.DocumentClient(config);
  }

  public putItem(item: Record<string, unknown>, tableName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const params = {
        Item: item,
        TableName: tableName,
      };

      this.client.put(params, (err: AWSError | undefined) => {
        if (err) {
          const dynamoErr = new Error(err.message);
          reject(dynamoErr);
        }
        resolve();
      });
    });
  }

  public scan(
    tableName: string,
    projectionExp: string,
    filters: FilterParams,
  ): Promise<AttributeMap[]> {
    return new Promise<AttributeMap[]>((resolve, reject) => {
      this.client.scan(
        {
          ProjectionExpression: projectionExp,
          TableName: tableName,
          ...filters,
        },
        (error: AWSError | unknown, data: ScanOutput) => {
          if (error) {
            reject(error);
          } else {
            resolve(data.Items ?? []);
          }
        },
      );
    });
  }

  public query(
    tableName: string,
    keyCondition: string,
    attributes: Record<string, unknown>,
  ): Promise<AttributeMap[]> {
    return new Promise<AttributeMap[]>((resolve, reject) => {
      this.client.query(
        {
          ExpressionAttributeValues: attributes,
          KeyConditionExpression: keyCondition,
          TableName: tableName,
        },
        (error: AWSError | unknown, data: QueryOutput) => {
          if (error) {
            reject(error);
          } else {
            resolve(data.Items ?? []);
          }
        },
      );
    });
  }

  // DynamoDB is considered healthy if a table scan can return a record
  public healthCheck(): Promise<ServiceHealthCheckResponse> {
    const status: ServiceHealthCheckResponse = {
      healthy: false,
      serviceName: 'Dynamo',
    };
    return new Promise(resolve => {
      try {
        const params = {
          Limit: 1,
        };
        // eslint believes `err` will always be truthy, temporarily adding `| null` here to quiet the linting.
        this.dynamo.listTables(params, (err: AWSError | null, data: DynamoDB.ListTablesOutput) => {
          try {
            if (err) {
              throw new Error(err.message);
              // eslint believes `data` will always be truthy, temporarily disabling rule here to quiet the linting.
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            } else if (!data || data.TableNames?.length !== 1) {
              throw new Error(`Did not have a table: ${JSON.stringify(data)}`);
            }
          } catch (error: unknown) {
            status.err = new Error(`DynamoDB encountered an error: ${(error as Error).message}`);
            status.err.action = 'checking health of DynamoDB';
            resolve(status);
            return;
          }
          status.healthy = true;
          resolve(status);
        });
      } catch (err: unknown) {
        (err as DevPortalError).action = 'checking health of DynamoDB';
        status.err = err as Error;
        resolve(status);
      }
    });
  }
}
