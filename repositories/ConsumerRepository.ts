import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import DynamoService from '../services/DynamoService';
import User from '../models/User';

export default class ConsumerRepository {
  private tableName: string = process.env.DYNAMODB_TABLE || '';
  private dynamoService: DynamoService;

  private removeDuplicates(consumer: User[]): User[] {
    // Instead of using a Set to remove duplicate emails, we use a Map.
    // This gives us easy entry if we want to merge user fields. For instance,
    // we might want to merge the oauth redirect uris or use the latest tosAccepted
    // value
    const consumerMap: Map<string, User> = new Map();

    consumer.forEach((user) => {
      consumerMap.set(user.email, user);
    });

    return Array.from(consumerMap.values());
  }

  public constructor(dynamoService: DynamoService) {
    this.dynamoService = dynamoService;
  }

  public async getConsumers(apiFilter: string[] = []): Promise<User[]> {

    let params: DocumentClient.ScanInput = {
      TableName: this.tableName,
    };

    // Build the filter expression and update params
    if (apiFilter.length > 0) {

      let filterExpression = '';
      const expressionAttributeValues = {};

      apiFilter.forEach((api, index) => {
        const varName = `:api_${api}`;
        expressionAttributeValues[varName] = api;
      
        // Build filter expression - only prefix with `or` if not the first element in the array
        if (index > 0) {
          filterExpression += ' or ';
        }
        filterExpression += `contains(apis, ${varName})`;
      });

      params = {
        ...params,
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues,
      };
    }
   
    const items: DocumentClient.AttributeMap[] =
      await this.dynamoService.scan(
        params.TableName, 
        'email, firstName, lastName, apis', 
        {
          FilterExpression: params.FilterExpression,
          ExpressionAttributeValues: params.ExpressionAttributeValues,
        },
      );

    const results = items.map((item): User => {
      return new User({
        firstName: item.firstName,
        lastName: item.lastName,
        organization: item.organization,
        email: item.email,
        apis: item.apis,
        description: item.description,
        oAuthRedirectURI: item.oAuthRedirectURI,
        oAuthApplicationType: '',
        termsOfService: item.tosAccepted,
      });
    });

    const uniqueUsersResults = this.removeDuplicates(results);
    return uniqueUsersResults;
  }

}