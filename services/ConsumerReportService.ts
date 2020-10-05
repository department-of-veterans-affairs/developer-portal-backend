import User from '../models/User';
import ConsumerRepository from '../repository/ConsumerRepository';

function trimTrailingCharacter(aString: string): string {
  return aString.slice(0, -1);
}

export default class ConsumerReportService {

  private ConsumerRepository: ConsumerRepository;
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

  public constructor(ConsumerRepository: ConsumerRepository) {
    this.ConsumerRepository = ConsumerRepository;
  }

  public async generateCSVReport(apiList: string[] = []): Promise<string> {
    let users: User[] = await this.ConsumerRepository.getUsers(apiList);
    users = this.ConsumerRepository.removeDuplicateUsers(users);
   
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