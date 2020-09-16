import { AWSError, DynamoDB } from 'aws-sdk';
import { ScanInput, ScanOutput, QueryOutput } from 'aws-sdk/clients/dynamodb';
import { DynamoConfig, MonitoredService, ServiceHealthCheckResponse } from '../types';
import logger from '../config/logger';
import { AttributeMap } from 'aws-sdk/clients/dynamodbstreams';

export type FilterParams = Pick<ScanInput, 'ExpressionAttributeValues' | 'FilterExpression'>;

export default class DynamoService implements MonitoredService {
  public client: DynamoDB.DocumentClient;
  public dynamo: DynamoDB;

  constructor(config: DynamoConfig) {
    this.dynamo = new DynamoDB(config);
    this.client = new DynamoDB.DocumentClient(config);
  }

  public putItem(item: object, tableName: string): Promise<void> {
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

  public scan(tableName: string, projectionExp: string, filters: FilterParams): Promise<AttributeMap[]> {
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
        }
      );
    });
  }

  public query(tableName: string, keyCondition: string, attributes: {}): Promise<AttributeMap[]> {
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
        }
      );
    });
  }

  // DynamoDB is considered healthy if a table scan can return a record
  public healthCheck(): Promise<ServiceHealthCheckResponse> {
    const status: ServiceHealthCheckResponse = {
      serviceName: 'Dynamo',
      healthy: false,
    };
    return new Promise((resolve) => {
      try {
        const params = {
          Limit: 1,
        };
        this.dynamo.listTables(params, (err, data) => {
          if (err) {
            status.err = new Error(`DynamoDB encountered an error: ${err.message}`);
            resolve(status);
            return;
          } else if (!data || data.TableNames?.length !== 1) {
            status.err = new Error(`DynamoDB did not have a table: ${JSON.stringify(data)}`);
            resolve(status);
            return;
          }
          status.healthy = true;
          resolve(status);
        });
      } catch (err) {
        err.action = 'checking health of DynamoDB';
        status.err = err;
        resolve(status);
      }
    });
  }
}
