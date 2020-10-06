import User from '../models/User';
import ConsumerRepository from '../repository/ConsumerRepository';
import ObjectsToCsv from 'objects-to-csv';

export default class ConsumerReportService {

  private ConsumerRepository: ConsumerRepository;

  public constructor(ConsumerRepository: ConsumerRepository) {
    this.ConsumerRepository = ConsumerRepository;
  }

  public async generateCSVReport(apiList: string[] = []): Promise<string> {
    let users: User[] = await this.ConsumerRepository.getUsers(apiList);
    users = this.ConsumerRepository.removeDuplicateUsers(users);

    const data = users.map(user => (
      {email: user.email,
      first_Name: user.firstName,
      last_Name: user.lastName,
      APIs: user.apis}
    ))

    const csv = new ObjectsToCsv(data);
 
    // Save to file:
    await csv.toDisk('./consumer-report.csv');
    const consumerReport = await csv.toString();

    return consumerReport
  }
}