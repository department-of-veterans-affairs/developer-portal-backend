import User from '../models/User';
import ConsumerRepository from '../repositories/ConsumerRepository';
import ObjectsToCsv from 'objects-to-csv';

export type OutputType = 'email' | 'firstName' | 'lastName' | 'apis';

interface CSVReportOptions {
  apiList: string[];
  oktaApplicationIdList: string[];
  writeToDisk: boolean;
  fields: OutputType[];
}

export default class ConsumerReportService {

  private consumerRepository: ConsumerRepository;

  public constructor(consumerRepository: ConsumerRepository) {
    this.consumerRepository = consumerRepository;
  }

  public async generateCSVReport(options: CSVReportOptions): Promise<string> {
    const { apiList, oktaApplicationIdList, fields } = options;
    
    const consumers: User[] = await this.consumerRepository.getConsumers(
      apiList,
      oktaApplicationIdList,
    );

    const data = consumers.map(consumer => {
      const obj: Record<string, unknown> = {};
      fields.forEach((field) => {
        switch(field) {
        case 'email':
          obj.email = consumer.email;
          break;
        case 'firstName':
          obj.first_Name = consumer.firstName;
          break;
        case 'lastName':
          obj.last_Name = consumer.lastName;
          break;
        case 'apis':
          obj.APIs = consumer.apis;
          break;
        }
      });

      return obj;
    });

    const csv = new ObjectsToCsv(data);
      
    if (options.writeToDisk) {
      // Save to file:
      await csv.toDisk('./consumer-report.csv');
    }
    const consumerReport = await csv.toString();

    return consumerReport;
  }
}