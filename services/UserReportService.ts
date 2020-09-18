import User from '../models/User';
import UserService from './UserService';

function trimTrailingCharacter(aString: string): string {
  return aString.slice(0, -1);
}

export default class UserReportService {

  private userService: UserService;
  private reportFields: string[] = [
    'email',
    'firstName',
    'lastName',
    'apis',
  ];
  private reportHeaders: string[] = [
    'Email',
    'First Name',
    'Last Name',
    'APIs',
  ];

  public constructor(userService: UserService) {
    this.userService = userService;
  }

  public async generateCSVReport(apiList: string[] = []): Promise<string> {
    const users: User[] = await this.userService.getUsers(apiList);

    let csv = '';

    this.reportHeaders.forEach((header) => {
      csv += `${header},`;
    });

    csv = trimTrailingCharacter(csv);
    csv += '\n';

    users.forEach((user) => {
      this.reportFields.forEach((field) => {
        csv += `"${user[field]}",`;
      });
      csv = trimTrailingCharacter(csv);
      csv += '\n';
    });

    csv = trimTrailingCharacter(csv);
    
    return csv;
  }
}