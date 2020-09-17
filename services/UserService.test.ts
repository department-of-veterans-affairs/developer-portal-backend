import 'jest'
import DynamoService from './DynamoService'
import UserService from './UserService'
import User from '../models/User'

const mockedUsersAB: User[] = [
  new User({
    firstName: 'Frodo',
    lastName: 'Baggins',
    organization: 'The Fellowship',
    email: 'fbag@hobbiton.com',
    apis: 'ab',
    description: 'super chill',
    oAuthRedirectURI: 'http://elvish-swords.com',
    oAuthApplicationType: 'default',
    termsOfService: true,
  })
]

const mockedUsers: User[] = mockedUsersAB.concat([
  new User({
    firstName: 'Gandalf',
    lastName: 'Gray',
    organization: 'The Fellowship',
    email: 'wizz@higherbeings.com',
    apis: 'va,xz,dx',
    description: 'super cool',
    oAuthRedirectURI: 'http://wanna-use-magic.com',
    oAuthApplicationType: 'default',
    termsOfService: true,
  })
]);

describe('UserService', ()=> {
  const mockQuery = jest.fn();

  const mockDynamoService = {
    query: mockQuery
  } as unknown as DynamoService;

  let userService: UserService = new UserService(mockDynamoService);

  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe('get users', () => {
    it('returns all users when no api list is given', async () => {

      mockQuery.mockResolvedValue(mockedUsers);

      let expectedMockedUsers = Array.from(mockedUsers);
      expectedMockedUsers[0].createdAt = expect.any(Date);
      expectedMockedUsers[1].createdAt = expect.any(Date);

      let users: object[] = await userService.getUsers();

      expect(users).toEqual(expectedMockedUsers)
    });

    it('returns the correct number of users when an api list is given', async () => {

      mockQuery.mockResolvedValue(mockedUsersAB);

      let apiList: string[] = ['ab']
      let users: object[] = await userService.getUsers(apiList)
      expect(users.length).toEqual(1);
    });
  });
});