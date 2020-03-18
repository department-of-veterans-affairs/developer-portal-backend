import { DynamoDB } from 'aws-sdk';

/*
  The AsyncDynamoClient provides an async interface to dynamo. It also
  simplifies calls to dynamo. The table name is passed into the constructor
  so you don't need to provide the table name for each dynamo call. Also
  the scan method will grab all items in the table paginating if needed.
  The scan method also accepts a type parameter and casts items to that
  object after retrieving from dynamo
*/
export class AsyncDynamoClient {
  private client: DynamoDB.DocumentClient;
  private TableName: string;

  constructor(TableName: string, client: DynamoDB.DocumentClient) {
    this.client = client;
    this.TableName = TableName;
  }

  public async update(Key: object, updateQuery: object) : Promise<DynamoDB.DocumentClient.UpdateItemOutput> {
    const TableName = this.TableName;
    const query = {TableName, Key, ...updateQuery};
    return new Promise((resolve, reject) => {
      this.client.update(query, (err, data) => {
        if(err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  public async scan<T>(baseQuery?: object, lastKey?: DynamoDB.Key) : Promise<T[]> {
    const TableName = this.TableName;
    const query = {...baseQuery, TableName, ExclusiveStartKey: lastKey}
    return new Promise<T[]>((resolve, reject) => {
      this.client.scan(query, async (err, data) => {
        if(err) {
          reject(err);
        } else {
          const items = data.Items as T[];
          if(items) {
            resolve(
              (data.LastEvaluatedKey) ?
              items.concat(await this.scan<T>(baseQuery, data.LastEvaluatedKey)) :
              items
            );
          } else {
            resolve([]);
          }
        }
      });
    });
  }
}
