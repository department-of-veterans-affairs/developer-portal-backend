import User from '../models/User'

export default class UserService {

  // TODO: Remove and use the dynamo service to get users
  private users: User[];

  public constructor(users: User[]) {
    this.users = users;
  }

  // TODO: Move user saving code to here

  public getUsers(apiFilter: string[] = []): User[] {
    if (apiFilter.length === 0) {
      return this.users;
    }

    // TODO - Remove and insert this filtering logic directly into a db query, if possible
    let filteredUsers = this.users.filter((user) => {
      return userHasApiInList(user, apiFilter)
    });
    return filteredUsers;
  }
}

function userHasApiInList(user: User, apiList: string[]): boolean {

  let matchingApis: string[] = user.apiList.filter((api: string) => {
    return apiList.includes(api);
  })

  return matchingApis.length > 0;
}