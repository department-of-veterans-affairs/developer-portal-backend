import { AWSError } from "aws-sdk";
import { AttributeMap, DocumentClient, ScanInput } from "aws-sdk/clients/dynamodb";
import { Moment } from "moment";

const DEFAULT_TABLE = "dvp-prod-developer-portal-users";

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
  benefits: number;
  facilities: number;
  vaForms: number;
  confirmation: number;
  health: number;
  communityCare: number;
  verification: number;
  claims: number;
}

export interface SignupCountResult {
  total: number;
  apiCounts: ApiSignupCounts;
}

export default class SignupMetricsService {
  private tableName: string = process.env.DYNAMODB_TABLE || DEFAULT_TABLE;
  private dynamoClient: DocumentClient;

  public constructor() {
    this.dynamoClient = new DocumentClient({
      httpOptions: {
        timeout: 5000
      },
      maxRetries: 1
    });
  }

  public querySignups(options: SignupQueryOptions = {}): Promise<Signup[]> {
    return new Promise<Signup[]>((resolve, reject) => {
      this.dynamoClient.scan(
        {
          TableName: this.tableName,
          ProjectionExpression: "email, createdAt, apis",
          ...this.buildFilterParams(options)
        },
        (error: AWSError, data: DocumentClient.ScanOutput) => {
          if (error) {
            reject(error);
          } else {
            const signups: Signup[] = this.mapItemsToSignups(data.Items || []);
            resolve(signups);
          }
        }
      );
    });
  }

  public async getUniqueSignups(options: SignupQueryOptions): Promise<Signup[]> {
    const signups = await this.querySignups(options);
    const signupsByEmail: { [email: string]: Signup } = {};
    const apisByEmail: { [email: string]: Set<string> } = {};

    signups.forEach((signup: Signup) => {
      const existingSignup = signupsByEmail[signup.email.toString()];
      if (!existingSignup || signup.createdAt < existingSignup.createdAt) {
        signupsByEmail[signup.email] = signup;
        apisByEmail[signup.email] = new Set<string>();
      }

      signup.apis
        .toString()
        .split(",")
        .forEach((apiId: string) => {
          apisByEmail[signup.email].add(apiId);
        });
    });

    const uniqueSignups = Object.values(signupsByEmail);
    uniqueSignups.forEach((signup: Signup) => {
      signup.apis = [...apisByEmail[signup.email]].sort().join(",");
    });

    return uniqueSignups;
  }

  public getPreviousSignups(signup: Signup): Promise<Signup[]> {
    return new Promise<Signup[]>((resolve, reject) => {
      this.dynamoClient.query(
        {
          TableName: this.tableName,
          ExpressionAttributeValues: {
            ":email": signup.email,
            ":signupDate": signup.createdAt
          },
          KeyConditionExpression: "email = :email and createdAt < :signupDate"
        },
        (error: AWSError, data: DocumentClient.QueryOutput) => {
          if (error) {
            reject(error);
          } else {
            resolve(this.mapItemsToSignups(data.Items || []));
          }
        }
      );
    });
  }

  public async countSignups(options: SignupQueryOptions): Promise<SignupCountResult> {
    const result = {
      total: 0,
      apiCounts: {
        benefits: 0,
        facilities: 0,
        vaForms: 0,
        confirmation: 0,
        health: 0,
        communityCare: 0,
        verification: 0,
        claims: 0
      }
    };

    const uniqueSignups: Signup[] = await this.getUniqueSignups(options);
    for (let i = 0; i < uniqueSignups.length; i++) {
      const previousSignups = await this.getPreviousSignups(uniqueSignups[i]);
      const newApis = new Set<string>(uniqueSignups[i].apis.split(","));
      if (previousSignups.length === 0) {
        result.total++;
      } else {
        previousSignups.forEach((signup: Signup) => {
          signup.apis.split(",").forEach((apiId: string) => {
            newApis.delete(apiId);
          });
        });
      }

      newApis.forEach((apiId: string) => {
        if (!(apiId in result.apiCounts)) {
          throw new Error(`Encountered unknown API: ${apiId}`);
        }

        result.apiCounts[apiId]++;
      });
    }

    return result;
  }

  private buildFilterParams(options: SignupQueryOptions): Partial<ScanInput> {
    let filterParams = {};
    if (options.startDate && options.endDate) {
      filterParams = {
        ExpressionAttributeValues: {
          ":startDate": options.startDate.toISOString(),
          ":endDate": options.endDate.toISOString()
        },
        FilterExpression: "createdAt BETWEEN :startDate AND :endDate"
      };
    } else if (options.startDate) {
      filterParams = {
        ExpressionAttributeValues: {
          ":startDate": options.startDate.toISOString()
        },
        FilterExpression: "createdAt >= :startDate"
      };
    } else if (options.endDate) {
      filterParams = {
        ExpressionAttributeValues: {
          ":endDate": options.endDate.toISOString()
        },
        FilterExpression: "createdAt <= :endDate"
      };
    }

    return filterParams;
  }

  private mapItemsToSignups(items: AttributeMap[]): Signup[] {
    return items.map(item => {
      return {
        email: item.email.toString(),
        createdAt: item.createdAt.toString(),
        apis: item.apis.toString()
      };
    });
  }
}
