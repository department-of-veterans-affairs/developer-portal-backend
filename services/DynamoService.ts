import { DynamoDB } from 'aws-sdk';
import { DynamoConfig, MonitoredService, ServiceHealthCheckResponse } from '../types';
import logger from '../config/logger';

export default class DynamoService implements MonitoredService {
  public client: DynamoDB.DocumentClient;

  constructor(config: DynamoConfig) {
    this.client = new DynamoDB.DocumentClient(config);
  }

  public async putItem(item: object, tableName: string): Promise<void> {
    // The DynamoDB API breaks if empty strings are passed in
    Object.keys(item).forEach((k) => {
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

      this.client.put(params, (err) => {
        if (err) {
          const dynamoErr = new Error(err.message);
          reject(dynamoErr);
        }
        resolve();
      });
    });
  }
  
  // DynamoDB is considered healthy if a table scan can return a record
  public async healthCheck(): Promise<ServiceHealthCheckResponse> {
    const tableName: string = process.env.DYNAMODB_TABLE || 'Users';
    
    return new Promise((resolve) => {
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
          err: err
        });
      }
    });
  }
}
