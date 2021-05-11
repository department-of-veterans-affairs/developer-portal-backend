import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import DynamoService from '../services/DynamoService';
import User, { UserConfig } from '../models/User';

interface OktaExpressions {
  filterExpression: string;
  expressionAttributeValues: Record<string, string>;
}

enum FilterType {
  CONTAINS,
  EQUALS,
}

function addFilterToQueryIfApplicable(
  filter: string[],
  fieldName: string,
  oktaQuery: OktaExpressions,
  filterType: FilterType = FilterType.CONTAINS,
): void {

  if (!filter || filter.length === 0) {
    return;
  }

  // Add an 'and' keyword if a filter has already been added
  if (oktaQuery.filterExpression) {
    oktaQuery.filterExpression += ' and ';
  }

  oktaQuery.filterExpression += '(';

  filter.forEach((item, index) => {
    const varName = `:${fieldName}_${index}`;
    oktaQuery.expressionAttributeValues[varName] = item;
  
    // Build filter expression - only prefix with `or` if not the first element in the array
    if (index > 0) {
      oktaQuery.filterExpression += ' or ';
    }

    switch(filterType) {
      case FilterType.EQUALS:
        oktaQuery.filterExpression += `${fieldName} = ${varName}`;
        break;
      case FilterType.CONTAINS:
      default:
        oktaQuery.filterExpression += `contains(${fieldName}, ${varName})`;
    }
    
  });

  oktaQuery.filterExpression += ')';
}

export default class ConsumerRepository {
  private tableName: string = process.env.DYNAMODB_TABLE || '';
  private dynamoService: DynamoService;

  private removeDuplicates(consumer: User[]): User[] {
    // Instead of using a Set to remove duplicate emails, we use a Map.
    // This gives us easy entry if we want to merge user fields. For instance,
    // we might want to merge the oauth redirect uris or use the latest tosAccepted
    // value
    const consumerMap = new Map<string, User>();

    consumer.forEach((user) => {
      consumerMap.set(user.email, user);
    });

    return Array.from(consumerMap.values());
  }

  public constructor(dynamoService: DynamoService) {
    this.dynamoService = dynamoService;
  }

  public async getConsumers(
    apiFilter: string[] = [],
    oktaApplicationIdFilter: string[] = [],
  ): Promise<User[]> {

    let params: DocumentClient.ScanInput = {
      TableName: this.tableName,
    };

    const oktaQuery: OktaExpressions = {
      filterExpression: '',
      expressionAttributeValues: {},
    };

    addFilterToQueryIfApplicable(apiFilter, 'apis', oktaQuery);
    addFilterToQueryIfApplicable(
      oktaApplicationIdFilter,
      'okta_application_id',
      oktaQuery,
      FilterType.EQUALS,
    );

    // validate there is an expression - if there are no arguments it will be blank
    if (oktaQuery.filterExpression) {
      params = {
        ...params,
        FilterExpression: oktaQuery.filterExpression,
        ExpressionAttributeValues: oktaQuery.expressionAttributeValues,
      };
    }

    const items: DocumentClient.AttributeMap[] =
      await this.dynamoService.scan(
        params.TableName, 
        'email, firstName, lastName, apis', 
        {
          FilterExpression: params.FilterExpression,
          ExpressionAttributeValues: params.ExpressionAttributeValues,
        },
      );
    
    const userConfigs = items.map((item): UserConfig => ({
      firstName: item.firstName as string,
      lastName: item.lastName as string,
      organization: item.organization as string,
      email: item.email as string,
      apis: item.apis as string,
      description: item.description as string,
      oAuthRedirectURI: item.oAuthRedirectURI as string,
      oAuthApplicationType: '',
      termsOfService: item.tosAccepted as boolean,
    }));

    const results = userConfigs.map((config: UserConfig): User => new User(config));

    const uniqueUsersResults = this.removeDuplicates(results);
    return uniqueUsersResults;
  }

}