import { AttributeMap } from 'aws-sdk/clients/dynamodb';
import { Moment } from 'moment';
import { API_LIST, HISTORICAL_APIS } from '../config/apis';
import { DEFAULT_TABLE } from '../util/environments';
import DynamoService, { FilterParams } from './DynamoService';

export interface SignupQueryOptions {
  startDate?: Moment;
  endDate?: Moment;
}

export interface Signup {
  email: string;
  createdAt: string;
  apis: string;
}

export interface ApiSignupCounts {
  [apiKey: string]: number;
}

export interface SignupCountResult {
  total: number;
  apiCounts: ApiSignupCounts;
}

export default class SignupMetricsService {
  private readonly tableName: string = process.env.DYNAMODB_TABLE ?? DEFAULT_TABLE;

  private readonly dynamoService: DynamoService;

  public constructor(dynamoService: DynamoService) {
    this.dynamoService = dynamoService;
  }

  private static buildFilterParams(options: SignupQueryOptions): FilterParams {
    let filterParams = {};
    if (options.startDate && options.endDate) {
      filterParams = {
        ExpressionAttributeValues: {
          ':endDate': options.endDate.toISOString(),
          ':startDate': options.startDate.toISOString(),
        },
        FilterExpression: 'createdAt BETWEEN :startDate AND :endDate',
      };
    } else if (options.startDate) {
      filterParams = {
        ExpressionAttributeValues: {
          ':startDate': options.startDate.toISOString(),
        },
        FilterExpression: 'createdAt >= :startDate',
      };
    } else if (options.endDate) {
      filterParams = {
        ExpressionAttributeValues: {
          ':endDate': options.endDate.toISOString(),
        },
        FilterExpression: 'createdAt <= :endDate',
      };
    }

    return filterParams;
  }

  private static mapItemsToSignups(items: AttributeMap[]): Signup[] {
    return items.map(item => ({
      /* eslint-disable @typescript-eslint/no-base-to-string */
      apis: item.apis.toString(),
      createdAt: item.createdAt.toString(),
      email: item.email.toString(),
      /* eslint-enable @typescript-eslint/no-base-to-string */
    }));
  }

  public async querySignups(options: SignupQueryOptions = {}): Promise<Signup[]> {
    const items = await this.dynamoService.scan(
      this.tableName,
      'email, createdAt, apis',
      SignupMetricsService.buildFilterParams(options),
    );

    return SignupMetricsService.mapItemsToSignups(items);
  }

  public async getUniqueSignups(options: SignupQueryOptions): Promise<Signup[]> {
    const signups = await this.querySignups(options);
    const signupsByEmail: { [email: string]: Signup } = {};
    const apisByEmail: { [email: string]: Set<string> } = {};

    signups.forEach((signup: Signup) => {
      const existingSignup = signupsByEmail[signup.email.toString()];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!existingSignup || signup.createdAt < existingSignup.createdAt) {
        signupsByEmail[signup.email] = signup;
        apisByEmail[signup.email] = new Set<string>();
      }

      signup.apis
        .toString()
        .split(',')
        .forEach((apiId: string) => {
          apisByEmail[signup.email].add(apiId);
        });
    });

    const uniqueSignups = Object.values(signupsByEmail);
    uniqueSignups.forEach((signup: Signup) => {
      signup.apis = [...apisByEmail[signup.email]].sort().join(',');
    });

    return uniqueSignups;
  }

  public async getPreviousSignups(signup: Signup): Promise<Signup[]> {
    const items: AttributeMap[] = await this.dynamoService.query(
      this.tableName,
      'email = :email and createdAt < :signupDate',
      {
        ':email': signup.email,
        ':signupDate': signup.createdAt,
      },
    );

    return SignupMetricsService.mapItemsToSignups(items);
  }

  public async countSignups(options: SignupQueryOptions): Promise<SignupCountResult> {
    const apiCounts = API_LIST.reduce((acc, current) => {
      acc[current] = 0;
      return acc;
    }, {});

    const result = {
      apiCounts,
      total: 0,
    };

    const uniqueSignups: Signup[] = await this.getUniqueSignups(options);
    for (const uniqueSignup of uniqueSignups) {
      const previousSignups = await this.getPreviousSignups(uniqueSignup);
      const newApis = new Set<string>(uniqueSignup.apis.split(','));
      if (previousSignups.length === 0) {
        result.total += 1;
      } else {
        previousSignups.forEach((signup: Signup) => {
          signup.apis.split(',').forEach((apiId: string) => {
            newApis.delete(apiId);
          });
        });
      }

      newApis.forEach((apiId: string) => {
        if (!HISTORICAL_APIS.includes(apiId) && !(apiId in result.apiCounts)) {
          throw new Error(`Encountered unknown API: ${apiId}`);
        }

        result.apiCounts[apiId] += 1;
      });
    }

    return result;
  }
}
