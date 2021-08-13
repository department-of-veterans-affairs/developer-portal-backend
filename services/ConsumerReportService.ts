import ObjectsToCsv from 'objects-to-csv';
import { UserDynamoItem } from '../models/User';
import ConsumerRepository from '../repositories/ConsumerRepository';
import { mergeUserDynamoItems } from '../util/merge-user-dynamo-items';

interface CSVReportOptions {
  apiList: string[];
  writeToDisk: boolean;
}

export default class ConsumerReportService {
  private readonly consumerRepository: ConsumerRepository;

  public constructor(consumerRepository: ConsumerRepository) {
    this.consumerRepository = consumerRepository;
  }

  public async generateCSVReport({ apiList, writeToDisk }: CSVReportOptions): Promise<string> {
    const consumers: UserDynamoItem[] = await this.consumerRepository.getConsumers(apiList);
    const uniqueConsumers = mergeUserDynamoItems(consumers);

    const data = uniqueConsumers.map(consumer => ({
      APIs: consumer.apis,
      email: consumer.email,
      first_Name: consumer.firstName,
      last_Name: consumer.lastName,
    }));

    const csv = new ObjectsToCsv(data);

    if (writeToDisk) {
      // Save to file:
      await csv.toDisk('./consumer-report.csv');
    }
    const consumerReport = await csv.toString();

    return consumerReport;
  }
}
