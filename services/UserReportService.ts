import User from '../models/User'
import UserService from './UserService'

export default class UserReportService {

  private userService: UserService;
  private reportFields: string[] = [
    'email',
  ]

  public constructor(userService: UserService) {
    this.userService = userService;
  }

  public async generateCSVReport(apiList: string[] = []): Promise<string> {
    let users: User[] = await this.userService.getUsers(apiList);

    let csv: string = '';

    this.reportFields.forEach((field) => {
      csv += `${field},`;
    })

    csv = trimTrailingCharacter(csv);
    csv += '\n';

    users.forEach((user) => {
      this.reportFields.forEach((field) => {
        csv += `${user[field]},`;
      })
      csv = trimTrailingCharacter(csv);
      csv += '\n';
    });

    csv = trimTrailingCharacter(csv);
    
    return csv;
  }
}

function trimTrailingCharacter(aString: string): string {
  return aString.slice(0, -1);
}