import { UserDynamoItem } from '../models/User';
import ConsumerRepository from '../repositories/ConsumerRepository';
import ObjectsToCsv from 'objects-to-csv';

export type OutputType = 'email' | 'firstName' | 'lastName' | 'apis' | 'oktaid';

interface CSVReportOptions {
  apiList: string[];
  oktaApplicationIdList: string[];
  writeToDisk: boolean;
  fields: OutputType[];
}

const mergeCommaSeparatedValues = (value1: string, value2: string): string => {
  const array1 = value1.split(',');
  const array2 = value2.split(',');
  const set = new Set([...array1, ...array2]);
  return [...set].join(',');
};

export default class ConsumerReportService {

  private consumerRepository: ConsumerRepository;

  public constructor(consumerRepository: ConsumerRepository) {
    this.consumerRepository = consumerRepository;
  }

  /**
   * Merges user dynamo items where their emails match
   */
  private mergeUserDynamoItems(consumer: UserDynamoItem[]): UserDynamoItem[] {
    // Instead of using a Set to remove duplicate emails, we use a Map.
    // This gives us easy entry if we want to merge user fields. For instance,
    // we might want to merge the oauth redirect uris or use the latest tosAccepted
    // value
    const consumerMap = new Map<string, UserDynamoItem>();

    consumer.forEach((user) => {
      const existingUser = consumerMap.get(user.email);
      if (existingUser) {
        // merge users
        // apis
        user.apis = mergeCommaSeparatedValues(user.apis, existingUser.apis);
        // okta app id
        const { okta_application_id } = user;
        if (okta_application_id) {
          if (existingUser.okta_application_id) {
            user.okta_application_id = mergeCommaSeparatedValues(
              okta_application_id,
              existingUser.okta_application_id,
            );
          }
        } else {
          user.okta_application_id = existingUser.okta_application_id;
        }
      }
      consumerMap.set(user.email, user);
    });

    return Array.from(consumerMap.values());
  }

  /**
   * Note: setting removeUsersWithDuplicateEmails to true will randomly remove users with the same
   * email. This means data can be lost in the report.
   * 
   * @param options {CSVReportOptions}
   * @returns 
   */
  public async generateCSVReport(options: CSVReportOptions): Promise<string> {
    const { apiList, oktaApplicationIdList, fields } = options;
    
    const consumers: UserDynamoItem[] = await this.consumerRepository.getDynamoConsumers(
      apiList,
      oktaApplicationIdList,
    );

    const data = this.mergeUserDynamoItems(consumers).map(consumer => {
      const obj: Record<string, unknown> = {};
      fields.forEach((field) => {
        switch(field) {
        case 'email':
          obj.email = consumer.email;
          break;
        case 'firstName':
          obj.firstName = consumer.firstName;
          break;
        case 'lastName':
          obj.lastName = consumer.lastName;
          break;
        case 'apis':
          obj.APIs = consumer.apis;
          break;
        case 'oktaid':
          obj.okta_application_id = consumer.okta_application_id;
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

