import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import DynamoService from '../services/DynamoService';
import { UserDynamoItem } from '../models/User';

interface OktaExpressions {
  filterExpression: string;
  expressionAttributeValues: Record<string, string>;
}

enum FilterType {
  CONTAINS,
  EQUALS,
}

const addFilterToQueryIfApplicable = (
  filter: string[],
  fieldName: string,
  oktaQuery: OktaExpressions,
  filterType: FilterType = FilterType.CONTAINS,
): void => {
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
};

export default class ConsumerRepository {
  private tableName: string = process.env.DYNAMODB_TABLE || '';
  private dynamoService: DynamoService;

  public constructor(dynamoService: DynamoService) {
    this.dynamoService = dynamoService;
  }

  public async getConsumers(
    apiFilter: string[] = [],
    oktaApplicationIdFilter: string[] = [],
  ): Promise<UserDynamoItem[]> {

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
        'email, firstName, lastName, apis, okta_application_id', 
        {
          FilterExpression: params.FilterExpression,
          ExpressionAttributeValues: params.ExpressionAttributeValues,
        },
      );
    
    const results = items.map((item): UserDynamoItem => ({
      apis: item.apis as string,
      email: item.email as string,
      firstName: item.firstName as string,
      lastName: item.lastName as string,
      organization: item.organization as string,
      oAuthRedirectURI: item.oAuthRedirectURI as string,
      kongConsumerId: item.kongConsumerId as string,
      tosAccepted: item.tosAccepted as boolean,
      description: item.description as string,
      createdAt: item.createdAt as string,
      okta_application_id: item.okta_application_id as string,
      okta_client_id: item.okta_client_id as string,
    }));

    return results;
  }

}
