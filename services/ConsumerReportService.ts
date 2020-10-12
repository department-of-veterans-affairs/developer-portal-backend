import User from '../models/User';
import ConsumerRepository from '../repositories/ConsumerRepository';
import ObjectsToCsv from 'objects-to-csv';

export default class ConsumerReportService {

  private consumerRepository: ConsumerRepository;

  public constructor(consumerRepository: ConsumerRepository) {
    this.consumerRepository = consumerRepository;
  }

  public async generateCSVReport(apiList: string[] = []): Promise<string> {
    const consumers: User[] = await this.consumerRepository.getConsumer(apiList);

    const data = consumers.map(consumer => (
      {
        email: consumer.email,
        first_Name: consumer.firstName,
        last_Name: consumer.lastName,
        APIs: consumer.apis,
      }
    ));

    const csv = new ObjectsToCsv(data);
 
    // Save to file:
    await csv.toDisk('./consumer-report.csv');
    const consumerReport = await csv.toString();

    return consumerReport;
  }
}