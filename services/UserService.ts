import { AttributeMap, ExpressionAttributeValueMap, DocumentClient } from 'aws-sdk/clients/dynamodb';

import DynamoService from './DynamoService';
import User from '../models/User';

const DEFAULT_TABLE = 'Users';

export default class UserService {
  private tableName: string = process.env.DYNAMODB_TABLE || DEFAULT_TABLE;
  private dynamoService: DynamoService;

  public constructor(dynamoService: DynamoService) {
    this.dynamoService = dynamoService;
  }

  // TODO: Move user saving code to here

  public async getUsers(apiFilter: string[] = []): Promise<User[]> {

    let params: DocumentClient.ScanInput = {
      TableName: this.tableName,
    };

    // Build the filter expression and update params
    if (apiFilter.length > 0) {

      let filterExpression = 'contains(apis, :api)';
      const expressionAttributeValues: DocumentClient.ExpressionAttributeValueMap = {
        ':api': apiFilter[0],
      };

      // Handle other elements [need to add the 'or(s)']
      for (let i = 1; i < apiFilter.length; i++) {
        const api: string = apiFilter[i];
        const varName = `:api${i}`;
        filterExpression += ` or contains(apis, ${varName})`;
        expressionAttributeValues[varName] = api;
      }

      params = {
        ...params,
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues,
      };
    }

    const items: AttributeMap[] = await this.dynamoService.hardScan(params);

    const results = items.map((item): User => {
      return new User({
        firstName: item.firstName.toString(),
        lastName: item.lastName.toString(),
        organization: item.organization.toString(),
        email: item.email.toString(),
        apis: item.apis.toString(),
        description: item.description.toString(),
        oAuthRedirectURI: item.oAuthRedirectURI.toString(),
        oAuthApplicationType: '',
        termsOfService: item.tosAccepted.toString() === 'true',
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