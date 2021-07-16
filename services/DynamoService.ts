import { AWSError, DynamoDB } from 'aws-sdk';
import { ScanInput, ScanOutput, QueryOutput } from 'aws-sdk/clients/dynamodb';
import { DynamoConfig, MonitoredService, ServiceHealthCheckResponse } from '../types';
import logger from '../config/logger';
import { AttributeMap } from 'aws-sdk/clients/dynamodbstreams';
import { DevPortalError } from '../models/DevPortalError';

export type FilterParams = Pick<ScanInput, 'ExpressionAttributeValues' | 'FilterExpression'>;

export default class DynamoService implements MonitoredService {
  public client: DynamoDB.DocumentClient;
  public dynamo: DynamoDB;

  constructor(config: DynamoConfig) {
    this.dynamo = new DynamoDB(config);
    this.client = new DynamoDB.DocumentClient(config);
  }

  public putItem(item: Record<string, unknown>, tableName: string): Promise<void> {
    // The DynamoDB API breaks if empty strings are passed in
    Object.keys(item).forEach(k => {
      if (item[k] === '') {
        logger.debug({ message: `converting ${k} from empty string to null` });
        item[k] = null;
      }
    });

    return new Promise((resolve, reject) => {
      const params = {
        Item: item,
        TableName: tableName,
      };

      this.client.put(params, err => {
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
          TableName: tableName,
          ProjectionExpression: projectionExp,
          ...filters,
        },
        (error: AWSError, data: ScanOutput) => {
          if (error) {
            reject(error);
          } else {
            resolve(data.Items || []);
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
          TableName: tableName,
          ExpressionAttributeValues: attributes,
          KeyConditionExpression: keyCondition,
        },
        (error: AWSError, data: QueryOutput) => {
          if (error) {
            reject(error);
          } else {
            resolve(data.Items || []);
          }
        },
      );
    });
  }

  // DynamoDB is considered healthy if a table scan can return a record
  public healthCheck(): Promise<ServiceHealthCheckResponse> {
    const status: ServiceHealthCheckResponse = {
      serviceName: 'Dynamo',
      healthy: false,
    };
    return new Promise(resolve => {
      try {
        const params = {
          Limit: 1,
        };
        this.dynamo.listTables(params, (err, data) => {
          try {
            if (err) {
              throw new Error(err.message);
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
