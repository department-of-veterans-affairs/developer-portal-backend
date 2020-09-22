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
      let expressionAttributeValues: DocumentClient.ExpressionAttributeValueMap = {
        ':api': apiFilter[0],
      };

      // Handle other elements [need to add the 'or(s)']
      for (let i: number = 1; i < apiFilter.length; i++) {
        const api: string = apiFilter[i];
        const varName: string = `:api${i}`;
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
}