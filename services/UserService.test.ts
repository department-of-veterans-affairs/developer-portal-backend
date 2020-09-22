import 'jest';
import DynamoService from './DynamoService';
import UserService from './UserService';
import User from '../models/User';

const mockedUsersAB: User[] = [
  new User({
    firstName: 'Frodo',
    lastName: 'Baggins',
    organization: 'The Fellowship',
    email: 'fbag@hobbiton.com',
    apis: 'ab',
    description: 'super chill',
    oAuthRedirectURI: 'http://elvish-swords.com',
    oAuthApplicationType: '',
    termsOfService: true,
  }),
];

const mockedUsers: User[] = mockedUsersAB.concat([
  new User({
    firstName: 'Gandalf',
    lastName: 'Gray',
    organization: 'The Fellowship',
    email: 'wizz@higherbeings.com',
    apis: 'va,xz,dx',
    description: 'super cool',
    oAuthRedirectURI: 'http://wanna-use-magic.com',
    oAuthApplicationType: '',
    termsOfService: true,
  }),
]);

describe('UserService', ()=> {
  const mockScan = jest.fn();

  const mockDynamoService = {
    hardScan: mockScan,
  } as unknown as DynamoService;

  const userService: UserService = new UserService(mockDynamoService);

  beforeEach(() => {
    mockScan.mockReset();
  });

  describe('get users', () => {
    it('returns all users when no api list is given', async () => {

      mockScan.mockResolvedValue(mockedUsers);

      const expectedMockedUsers: User[] = Array.from(mockedUsers);
      expectedMockedUsers[0].createdAt = expect.any(Date);
      expectedMockedUsers[1].createdAt = expect.any(Date);

      const users: User[] = await userService.getUsers();

      expect(users).toEqual(expectedMockedUsers);
    });

    it('returns the correct number of users when an api list is given', async () => {

      mockScan.mockResolvedValue(mockedUsersAB);

      const apiList: string[] = ['ab'];
      const users: User[] = await userService.getUsers(apiList);
      expect(users.length).toEqual(1);
    });
  });

  describe('remove duplicate users', () => {
    it('removes any duplicate users', () => {
      const mockDuplicateUsers: User[] = mockedUsers.concat([
        {
          ...mockedUsers[0],
          apis: 'benefits,facilities',
        } as User,
      ]);

      let filteredUsers: User[] = userService.removeDuplicateUsers(mockDuplicateUsers);
      expect(filteredUsers.length).toEqual(mockedUsers.length);
    });
  });
});