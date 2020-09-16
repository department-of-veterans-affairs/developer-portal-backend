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

  public generateCSVReport(apiList: string[] = []): string {
    let users: User[] = this.userService.getUsers(apiList);

    let csv: string = '';

    this.reportFields.forEach((field) => {
      csv += `${field},`;
    })

    csv += '\n';

    users.forEach((user) => {
      this.reportFields.forEach((field) => {
        csv += `${user[field]},`;
      })
      csv += '\n';
    });
    
    return csv;
  }
}