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
    scan: mockScan,
  } as unknown as DynamoService;

  const consumerRepo: ConsumerRepository = new ConsumerRepository(mockDynamoService);

  beforeEach(() => {
    mockScan.mockReset();
  });

  describe('get users', () => {
    it('returns all users when no api list is given', async () => {
      mockScan.mockResolvedValue(mockUserList);

      const users: User[] = await consumerRepo.getConsumers();

      expect(users).toEqual(expectedMockedUsers);
    });

    it('should call dynamo scan method with proper params', async () => { 
      mockScan.mockResolvedValue([mockedUsersAB]);  
      
      const tableName = process.env.DYNAMODB_TABLE;
      const projectionExp = 'email, firstName, lastName, apis'
      const expressionAttributeValues = {":api_ab": "ab"}
      const filterExpression = "contains(apis, :api_ab)"

      const apiList: string[] = ['ab'];
      const users: User[] = await consumerRepo.getConsumers(apiList);

      expect(mockScan)
        .toHaveBeenCalledWith(
          tableName, 
          projectionExp, 
          {
            ExpressionAttributeValues: expressionAttributeValues,
            FilterExpression: filterExpression,
          });
    });
  });

});