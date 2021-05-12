import 'jest';
import User from '../models/User';
import DynamoService from './DynamoService';
import ConsumerRepository from '../repositories/ConsumerRepository';
import ConsumerReportService, { OutputType } from './ConsumerReportService';

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
  new User({
    firstName: 'Frodo',
    lastName: 'Baggins',
    organization: 'The Fellowship',
    email: 'fbag@hobbiton.com',
    apis: 'xz',
    description: 'super chill',
    oAuthRedirectURI: 'http://elvish-swords.com',
    oAuthApplicationType: '',
    termsOfService: true,
  }),
]);

describe('ConsumerReportService', () => {
  const mockScan = jest.fn();

  const mockDynamoService = {
    scan: mockScan,
  } as unknown as DynamoService;

  const consumerRepo: ConsumerRepository = new ConsumerRepository(mockDynamoService);
  const consumerReportServ: ConsumerReportService = new ConsumerReportService(consumerRepo);

  beforeEach(() => {
    mockScan.mockReset();
  });

  describe('generate csv report', () => {
    it('returns a csv of all users when no arguments are given', async () => {
      const fields: OutputType[] = ['email', 'firstName', 'lastName', 'apis'];
      mockScan.mockResolvedValue(mockedUsers);

      const report = await consumerReportServ.generateCSVReport({
        writeToDisk: false,
        apiList: [],
        oktaApplicationIdList: [],
        fields,
      });
      // fbag@hobbiton.com merged dynamo item
      expect(report).toContain('fbag@hobbiton.com');
      expect(report).toContain('"xz,ab"');
      // wizz@higherbeings.com merged dynamo item
      expect(report).toContain('wizz@higherbeings.com');
      expect(report).toContain('"va,xz,dx"');
    });

  });
});

