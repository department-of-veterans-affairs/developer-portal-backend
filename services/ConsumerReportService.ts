import User from '../models/User';
import ConsumerRepository from '../repositories/ConsumerRepository';
import ObjectsToCsv from 'objects-to-csv';

interface CSVReportOptions {
  apiList: string[];
  writeToDisk: boolean;
}

export default class ConsumerReportService {

  private consumerRepository: ConsumerRepository;

  public constructor(consumerRepository: ConsumerRepository) {
    this.consumerRepository = consumerRepository;
  }

  public async generateCSVReport({apiList = [], writeToDisk =  true}: CSVReportOptions): Promise<string> {

    const consumers: User[] = await this.consumerRepository.getConsumers(apiList);
    
    const data = consumers.map(consumer => (
      {
        email: consumer.email,
        first_Name: consumer.firstName,
        last_Name: consumer.lastName,
        APIs: consumer.apis,
      }
    ));

    const csv = new ObjectsToCsv(data);
      
    if (writeToDisk) {
      // Save to file:
      await csv.toDisk('./consumer-report.csv');
    }
    const consumerReport = await csv.toString();

    return consumerReport;
  }
}