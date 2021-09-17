import 'jest';
import User from '../models/User';
import ConsumerRepository from '../repositories/ConsumerRepository';
import DynamoService from './DynamoService';
import ConsumerReportService from './ConsumerReportService';

const mockedUsersAB: User[] = [
  new User({
    apis: 'ab',
    description: 'super chill',
    email: 'fbag@hobbiton.com',
    firstName: 'Frodo',
    lastName: 'Baggins',
    oAuthApplicationType: '',
    oAuthRedirectURI: 'http://elvish-swords.com',
    organization: 'The Fellowship',
    termsOfService: true,
  }),
];

const mockedUsers: User[] = mockedUsersAB.concat([
  new User({
    apis: 'va,xz,dx',
    description: 'super cool',
    email: 'wizz@higherbeings.com',
    firstName: 'Gandalf',
    lastName: 'Gray',
    oAuthApplicationType: '',
    oAuthRedirectURI: 'http://wanna-use-magic.com',
    organization: 'The Fellowship',
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
    it('returns a csv of all users when no api list is given', async () => {
      mockScan.mockResolvedValue(mockedUsers);

      const report = await consumerReportServ.generateCSVReport({
        apiList: [],
        writeToDisk: false,
      });
      expect(report).toContain('fbag@hobbiton.com');
      expect(report).toContain('wizz@higherbeings.com');
    });
  });
});
