import 'jest';
import DynamoService from '../services/DynamoService';
import ConsumerRepository from './ConsumerRepository';
import { UserDynamoItem } from '../models/User';

const mockUserList: UserDynamoItem[] = [
  {
    firstName: 'Frodo',
    lastName: 'Baggins',
    organization: 'The Fellowship',
    email: 'fbag@hobbiton.com',
    apis: 'ab',
    description: 'super chill',
    oAuthRedirectURI: 'http://elvish-swords.com',
    tosAccepted: true,
    createdAt: '1234567890',
    okta_application_id: 'okta-id',
    okta_client_id: 'okta-client-id',
  },
  {
    firstName: 'Gandalf',
    lastName: 'Gray',
    organization: 'The Fellowship',
    email: 'wizz@higherbeings.com',
    apis: 'va,xz,dx',
    description: 'super cool',
    oAuthRedirectURI: 'http://wanna-use-magic.com',
    tosAccepted: true,
    createdAt: '1234567890',
  },
];

const mockedUsersAB: UserDynamoItem = mockUserList[0];

const expectedMockedUsers: UserDynamoItem[] = Array.from(mockUserList);

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
    it('returns all users when no args are given', async () => {
      mockScan.mockResolvedValue(mockUserList);

      const users: UserDynamoItem[] = await consumerRepo.getDynamoConsumers();

      expect(users).toEqual(expectedMockedUsers);
    });

    it('should call dynamo scan with proper params with only api list given', async () => {
      mockScan.mockResolvedValue([mockedUsersAB]);  
      
      const tableName = process.env.DYNAMODB_TABLE;
      const projectionExp = 'email, firstName, lastName, apis, okta_application_id';
      const expressionAttributeValues = {":apis_0": "ab"};
      const filterExpression = "(contains(apis, :apis_0))";

      const apiList: string[] = ['ab'];
      await consumerRepo.getDynamoConsumers(apiList);

      expect(mockScan)
        .toHaveBeenCalledWith(
          tableName, 
          projectionExp, 
          {
            ExpressionAttributeValues: expressionAttributeValues,
            FilterExpression: filterExpression,
          }
        );
    });

    it(
      'should call dynamo scan with proper prarams with only okta application id list given',
      async () => { 
        mockScan.mockResolvedValue([mockedUsersAB]);  
        
        const tableName = process.env.DYNAMODB_TABLE;
        const projectionExp = 'email, firstName, lastName, apis, okta_application_id';
        const expressionAttributeValues = {":okta_application_id_0": "my-okta-id"};
        const filterExpression = "(okta_application_id = :okta_application_id_0)";

        const oktaApplicationIdList: string[] = ['my-okta-id'];
        await consumerRepo.getDynamoConsumers(undefined, oktaApplicationIdList);

        expect(mockScan)
          .toHaveBeenCalledWith(
            tableName, 
            projectionExp, 
            {
              ExpressionAttributeValues: expressionAttributeValues,
              FilterExpression: filterExpression,
            }
          );
      }
    );

    it(
      'should call dynamo scan with proper prarams with all arguments given',
      async () => { 
        mockScan.mockResolvedValue([mockedUsersAB]);  
        
        const tableName = process.env.DYNAMODB_TABLE;
        const projectionExp = 'email, firstName, lastName, apis, okta_application_id';
        const expressionAttributeValues = {
          ':apis_0': 'ab',
          ':okta_application_id_0': 'myid',
        };
        const filterExpression =
          '(contains(apis, :apis_0)) and ' +
          '(okta_application_id = :okta_application_id_0)';

        const apiList: string[] = ['ab'];
        const oktaApplicationIdList: string[] = ['myid'];
        await consumerRepo.getDynamoConsumers(apiList, oktaApplicationIdList);

        expect(mockScan)
          .toHaveBeenCalledWith(
            tableName,
            projectionExp,
            {
              ExpressionAttributeValues: expressionAttributeValues,
              FilterExpression: filterExpression,
            }
          );
      }
    );
  });

});

