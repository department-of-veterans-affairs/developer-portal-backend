import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import DynamoService from '../services/DynamoService';
import User from '../models/User';

const DEFAULT_TABLE = 'dvp-prod-developer-portal-users';

export default class ConsumerRepository {
  private tableName: string = process.env.DYNAMODB_TABLE || DEFAULT_TABLE;
  private dynamoService: DynamoService;

  public constructor(dynamoService: DynamoService) {
    this.dynamoService = dynamoService;
  }

  public async getUsers(apiFilter: string[] = []): Promise<User[]> {

    let params: DocumentClient.ScanInput = {
      TableName: this.tableName,
    };

    // Build the filter expression and update params
    if (apiFilter.length > 0) {

      let filterExpression = '';
      const expressionAttributeValues = {};

      apiFilter.forEach((api, index) => {
        const varName = `:api${index}`;
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

    const items: DocumentClient.AttributeMap[] = await this.dynamoService.hardScan(params);

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

    return results;
  }

  public removeDuplicateUsers(users: User[]): User[] {
    // Instead of using a Set to remove duplicate emails, we use a Map.
    // This gives us easy entry if we want to merge user fields. For instance,
    // we might want to merge the oauth redirect uris or use the latest tosAccepted
    // value
    const userMap: Map<string, User> = new Map();

    users.forEach((user) => {
      userMap.set(user.email, user);
    });

    return Array.from(userMap.values());
  }
}