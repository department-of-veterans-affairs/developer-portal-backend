import { AttributeMap } from 'aws-sdk/clients/dynamodb';
import DynamoService from './DynamoService';
import User from '../models/User';

const DEFAULT_TABLE = 'dvp-prod-developer-portal-users';

export default class UserService {
  private tableName: string = process.env.DYNAMODB_TABLE || DEFAULT_TABLE;
  private dynamoService: DynamoService;

  public constructor(dynamoService: DynamoService) {
    this.dynamoService = dynamoService;
  }

  // TODO: Move user saving code to here

  // TODO: Fix return type to User
  public async getUsers(apiFilter: string[] = []): Promise<User[]> {
    const items: AttributeMap[] = await this.dynamoService.query(
      this.tableName,
      null as unknown as string,
      null as unknown as object,
    );

    const results = items.map((item): User => {
      return new User({
        firstName: item.firstName.toString(),
        lastName: item.lastName.toString(),
        organization: item.organization.toString(),
        email: item.email.toString(),
        apis: item.apis.toString(),
        description: item.description.toString(),
        oAuthRedirectURI: item.oAuthRedirectURI.toString(),
        oAuthApplicationType: item.oAuthApplicationType.toString(),
        termsOfService: item.tosAccepted.toString() === 'true',
      });
    });

    return results;

    // // TODO - Remove and insert this filtering logic directly into a db query, if possible
    // let filteredUsers = this.users.filter((user) => {
    //   return userHasApiInList(user, apiFilter)
    // });
    // return filteredUsers;
  }
}

// function userHasApiInList(user: User, apiList: string[]): boolean {

//   let matchingApis: string[] = user.apiList.filter((api: string) => {
//     return apiList.includes(api);
//   })

//   return matchingApis.length > 0;
// }