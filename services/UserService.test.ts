import 'jest'
import UserService from './UserService'
import User from '../models/User'

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

describe('UserService', ()=> {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService(mockedUsers)
  });

  describe('get users', () => {
    it('returns all users when no api list is given', () => {

      let users: User[] = userService.getUsers();
      expect(users).toEqual(mockedUsers)
    });

    it('returns the correct number of users when an api list is given', () => {

      let apiList: string[] = ['ab']
      let users: User[] = userService.getUsers(apiList)
      expect(users.length).toEqual(1);
    });
  });
});