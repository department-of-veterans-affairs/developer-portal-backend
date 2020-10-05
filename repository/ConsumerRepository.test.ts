import 'jest';
import DynamoService from '../services/DynamoService';
import ConsumerRepository from './ConsumerRepository';
import User from '../models/User';

const mockUserList: User[] = [
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
];

const mockedUsersAB: User = mockUserList[0];

const expectedMockedUsers: User[] = Array.from(mockUserList);
expectedMockedUsers[0].createdAt = expect.any(Date);
expectedMockedUsers[1].createdAt = expect.any(Date);

describe('ConsumerRepository', ()=> {
  const mockScan = jest.fn();

  const mockDynamoService = {
    hardScan: mockScan,
  } as unknown as DynamoService;

  const ConsumerRepo: ConsumerRepository = new ConsumerRepository(mockDynamoService);

  beforeEach(() => {
    mockScan.mockReset();
  });

  describe('get users', () => {
    it('returns all users when no api list is given', async () => {
      mockScan.mockResolvedValue(mockUserList);

      const users: User[] = await ConsumerRepo.getUsers();

      expect(users).toEqual(expectedMockedUsers);
    });

    it('returns the correct number of users when an api list is given', async () => {

      mockScan.mockResolvedValue([mockedUsersAB]);

      const apiList: string[] = ['ab'];
      const users: User[] = await ConsumerRepo.getUsers(apiList);
      expect(users.length).toEqual(1);
    });
  });

  describe('remove duplicate users', () => {
    it('removes any duplicate users', () => {
      const mockDuplicateUsers: User[] = mockUserList.concat([
        {
          ...mockUserList[0],
          apis: 'benefits,facilities',
        } as User,
      ]);
      
      const filteredUsers: User[] = ConsumerRepo.removeDuplicateUsers(mockDuplicateUsers);
      
      expect(filteredUsers.length).toEqual(mockUserList.length);
      expect(filteredUsers).toContain(mockDuplicateUsers[2]);
    });
  });
});