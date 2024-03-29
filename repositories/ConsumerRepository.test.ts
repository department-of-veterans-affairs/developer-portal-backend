import 'jest';
import DynamoService from '../services/DynamoService';
import { UserDynamoItem } from '../models/User';
import ConsumerRepository from './ConsumerRepository';

const mockUserList: UserDynamoItem[] = [
  {
    apis: 'ab',
    createdAt: '1234567890',
    description: 'super chill',
    email: 'fbag@hobbiton.com',
    firstName: 'Frodo',
    lastName: 'Baggins',
    oAuthRedirectURI: 'http://elvish-swords.com',
    okta_application_id: 'okta-id',
    okta_client_id: 'okta-client-id',
    organization: 'The Fellowship',
    programName: 'shire-hero',
    sponsorEmail: 'bbag@hobbiton.com',
    tosAccepted: true,
    vaEmail: 'frodo.baggins@shire.com',
  },
  {
    apis: 'va,xz,dx',
    createdAt: '1234567890',
    description: 'super cool',
    email: 'wizz@higherbeings.com',
    firstName: 'Gandalf',
    lastName: 'Gray',
    oAuthRedirectURI: 'http://wanna-use-magic.com',
    organization: 'The Fellowship',
    programName: 'Istari',
    sponsorEmail: 'manwe@ainur.com',
    tosAccepted: true,
    vaEmail: 'olorin@middle-earth.com',
  },
];

const mockedUsersAB: UserDynamoItem = mockUserList[0];

const expectedMockedUsers: UserDynamoItem[] = Array.from(mockUserList);

describe('ConsumerRepository', () => {
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

      const users: UserDynamoItem[] = await consumerRepo.getConsumers();

      expect(users).toEqual(expectedMockedUsers);
    });

    it('should call dynamo scan with proper params with only api list given', async () => {
      mockScan.mockResolvedValue([mockedUsersAB]);

      const tableName = process.env.DYNAMODB_TABLE;
      const projectionExp = 'email, firstName, lastName, apis, okta_application_id';
      const expressionAttributeValues = { ':apis_0': 'ab' };
      const filterExpression = '(contains(apis, :apis_0))';

      const apiList: string[] = ['ab'];
      await consumerRepo.getConsumers(apiList);

      expect(mockScan).toHaveBeenCalledWith(tableName, projectionExp, {
        ExpressionAttributeValues: expressionAttributeValues,
        FilterExpression: filterExpression,
      });
    });

    it('should call dynamo scan with proper prarams with only okta application id list given', async () => {
      mockScan.mockResolvedValue([mockedUsersAB]);

      const tableName = process.env.DYNAMODB_TABLE;
      const projectionExp = 'email, firstName, lastName, apis, okta_application_id';
      const expressionAttributeValues = { ':okta_application_id_0': 'my-okta-id' };
      const filterExpression = '(okta_application_id = :okta_application_id_0)';

      const oktaApplicationIdList: string[] = ['my-okta-id'];
      await consumerRepo.getConsumers(undefined, oktaApplicationIdList);

      expect(mockScan).toHaveBeenCalledWith(tableName, projectionExp, {
        ExpressionAttributeValues: expressionAttributeValues,
        FilterExpression: filterExpression,
      });
    });

    it('should call dynamo scan with proper prarams with all arguments given', async () => {
      mockScan.mockResolvedValue([mockedUsersAB]);

      const tableName = process.env.DYNAMODB_TABLE;
      const projectionExp = 'email, firstName, lastName, apis, okta_application_id';
      const expressionAttributeValues = {
        ':apis_0': 'ab',
        ':okta_application_id_0': 'myid',
      };
      const filterExpression =
        '(contains(apis, :apis_0)) and (okta_application_id = :okta_application_id_0)';

      const apiList: string[] = ['ab'];
      const oktaApplicationIdList: string[] = ['myid'];
      await consumerRepo.getConsumers(apiList, oktaApplicationIdList);

      expect(mockScan).toHaveBeenCalledWith(tableName, projectionExp, {
        ExpressionAttributeValues: expressionAttributeValues,
        FilterExpression: filterExpression,
      });
    });
  });
});
