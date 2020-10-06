import 'jest';
import User from '../models/User';
import DynamoService from './DynamoService';
import ConsumerRepository from '../repository/ConsumerRepository';
import ConsumerReportService from './ConsumerReportService';

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

describe('ConsumerReportService', () => {
  const mockScan = jest.fn();

  const mockDynamoService = {
    hardScan: mockScan,
  } as unknown as DynamoService;

  const consumerRepo: ConsumerRepository = new ConsumerRepository(mockDynamoService);
  const consumerReportServ: ConsumerReportService = new ConsumerReportService(consumerRepo);

  beforeEach(() => {
    mockScan.mockReset();
  });

  describe('generate csv report', () => {
    it('returns a csv of all users when no api list is given', async () => {

      mockScan.mockResolvedValue(mockedUsers);

      const reportText = `email,first_Name,last_Name,APIs\nfbag@hobbiton.com,Frodo,Baggins,ab\nwizz@higherbeings.com,Gandalf,Gray,"va,xz,dx"`;

      const report = await consumerReportServ.generateCSVReport();
      expect(report).toEqual(reportText);
    });

    it('returns a csv of filtered users based on the api list given', async () => {

      mockScan.mockResolvedValue(mockedUsersAB);

      const reportText = 'email,first_Name,last_Name,APIs\nfbag@hobbiton.com,Frodo,Baggins,ab';
      const apiList = ['ab'];

      const report = await consumerReportServ.generateCSVReport(apiList);
      expect(report).toEqual(reportText);
    });
  });
});