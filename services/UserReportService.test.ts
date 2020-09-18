import 'jest';
import User from '../models/User';
import DynamoService from './DynamoService';
import UserService from './UserService';
import UserReportService from './UserReportService';

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

describe('UserReportService', () => {
  const mockScan = jest.fn();

  const mockDynamoService = {
    hardScan: mockScan,
  } as unknown as DynamoService;

  const userService: UserService = new UserService(mockDynamoService);
  const userReportService: UserReportService = new UserReportService(userService);

  beforeEach(() => {
    mockScan.mockReset();
  });

  describe('generate csv report', () => {
    it('returns a csv of all users when no api list is given', async () => {

      mockScan.mockResolvedValue(mockedUsers);

      const reportText = 'Email,First Name,Last Name,APIs\n"fbag@hobbiton.com","Frodo","Baggins","ab"\n"wizz@higherbeings.com","Gandalf","Gray","va,xz,dx"';

      const report = await userReportService.generateCSVReport();
      expect(report).toEqual(reportText);
    });

    it('returns a csv of filtered users based on the api list given', async () => {

      mockScan.mockResolvedValue(mockedUsersAB);

      const reportText = 'Email,First Name,Last Name,APIs\n"fbag@hobbiton.com","Frodo","Baggins","ab"';
      const apiList = ['ab'];

      const report = await userReportService.generateCSVReport(apiList);
      expect(report).toEqual(reportText);
    });
  });
});