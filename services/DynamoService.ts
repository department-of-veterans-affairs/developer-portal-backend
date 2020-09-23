import { AWSError } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { DynamoConfig, MonitoredService, ServiceHealthCheckResponse } from '../types';
import logger from '../config/logger';

export type FilterParams = Pick<DocumentClient.ScanInput, 'ExpressionAttributeValues' | 'FilterExpression'>;

export default class DynamoService implements MonitoredService {
  public client: DocumentClient;

  constructor(config: DynamoConfig) {
    this.client = new DocumentClient(config);
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

  public scan(tableName: string, projectionExp: string, filters: FilterParams): Promise<DocumentClient.AttributeMap[]> {
    return new Promise<DocumentClient.AttributeMap[]>((resolve, reject) => {
      this.client.scan(
        {
          TableName: tableName,
          ProjectionExpression: projectionExp,
          ...filters,
        },
        (error: AWSError, data: DocumentClient.ScanOutput) => {
          if (error) {
            reject(error);
          } else {
            resolve(data.Items || []);
          }
        }
      );
    });
  }

  public hardScan(params: DocumentClient.ScanInput): Promise<DocumentClient.AttributeMap[]> {
    return new Promise<DocumentClient.AttributeMap[]>((resolve, reject) => {
      this.client.scan(
        params,
        (error: AWSError, data: DocumentClient.ScanOutput) => {
          if (error) {
            reject(error);
          } else {
            resolve(data.Items || []);
          }
        }
      );
    });
  }

  public query(tableName: string, keyCondition: string, attributes: {}): Promise<DocumentClient.AttributeMap[]> {
    return new Promise<DocumentClient.AttributeMap[]>((resolve, reject) => {
      this.client.query(
        {
          TableName: tableName,
          ExpressionAttributeValues: attributes,
          KeyConditionExpression: keyCondition,
        },
        (error: AWSError, data: DocumentClient.QueryOutput) => {
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
    const tableName: string = process.env.DYNAMODB_TABLE || 'Users';

    return new Promise(resolve => {
      try {
        const params = {
          Limit: 1,
          TableName: tableName,
        };

        this.client.scan(params, (err, data) => {
          if (err) {
            throw new Error(`DynamoDB encountered an error: ${err.message}`);
          } else if (!data || data.Count !== 1) {
            throw new Error(`DynamoDB did not return a record: ${JSON.stringify(data)}`);
          }
          resolve({
            serviceName: 'Dynamo',
            healthy: true,
          });
        });
      } catch (err) {
        err.action = 'checking health of DynamoDB';
        resolve({
          serviceName: 'Dynamo',
          healthy: false,
          err: err,
        });
      }
    });
  }
}
