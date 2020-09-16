import 'jest'
import User from '../models/User'
import UserService from './UserService';
import UserReportService from './UserReportService';

const mockedUsers: User[] = [
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
  }),
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
  }),
];

describe('UserReportService', () => {
  let userService: UserService;
  let userReportService: UserReportService;

  beforeEach(() => {
    userService = new UserService(mockedUsers);
    userReportService = new UserReportService(userService);
  });

  describe('generate csv report', () => {
    it('returns a csv of all users when no api list is given', () => {

      let reportText: string = 'email,\nwizz@higherbeings.com,\nfbag@hobbiton.com,\n';

      let report = userReportService.generateCSVReport();
      expect(report).toEqual(reportText);
    });

    it('returns a csv of filtered users based on the api list given', () => {

      let reportText: string = 'email,\nfbag@hobbiton.com,\n';
      let apiList = ['ab']

      let report = userReportService.generateCSVReport(apiList);
      expect(report).toEqual(reportText)
    });
  })
});