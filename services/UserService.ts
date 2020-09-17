import { AttributeMap, ScanInput } from 'aws-sdk/clients/dynamodb';

import DynamoService from './DynamoService';
import User from '../models/User';

const DEFAULT_TABLE = 'Users';

function userHasApiInList(user: User, apiList: string[]): boolean {

  const matchingApis: string[] = user.apiList.filter((api: string) => {
    return apiList.includes(api);
  });

  return matchingApis.length > 0;
}

export default class UserService {
  private tableName: string = process.env.DYNAMODB_TABLE || DEFAULT_TABLE;
  private dynamoService: DynamoService;

  public constructor(dynamoService: DynamoService) {
    this.dynamoService = dynamoService;
  }

  // TODO: Move user saving code to here

  public async getUsers(apiFilter: string[] = []): Promise<User[]> {
    const params: ScanInput = {
      TableName: this.tableName,
    };

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

    if (apiFilter.length === 0) {
      return results;
    }

    // // TODO - Remove and insert this filtering logic directly into a db query, if possible
    const filteredUsers = results.filter((user) => {
      return userHasApiInList(user, apiFilter);
    });
    return filteredUsers;
  }
}