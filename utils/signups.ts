import { AWSError } from 'aws-sdk';
import { AttributeMap, DocumentClient, ScanInput } from 'aws-sdk/clients/dynamodb';
import filter from 'lodash.filter';
import moment, { Moment } from 'moment';

const DEFAULT_TABLE = 'dvp-prod-developer-portal-users';

export interface SignupQueryOptions {
  startDate?: Moment;
  endDate?: Moment;
}

const buildFilterParams = (options: SignupQueryOptions): Partial<ScanInput> => {
  let filterParams = {};
  if (options.startDate && options.endDate) {
    filterParams = {
      ExpressionAttributeValues: {
        ':startDate': options.startDate.toISOString(),
        ':endDate': options.endDate.toISOString(),
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
};

export const querySignups = async (options: SignupQueryOptions = {}): Promise<AttributeMap[]> => {
  const tableName = process.env.DYNAMODB_TABLE || DEFAULT_TABLE;
  const dynamoClient = new DocumentClient({
    httpOptions: {
      timeout: 5000,
    },
    maxRetries: 1,
  });

  return await new Promise<AttributeMap[]>(
    (resolve, reject) => {
      dynamoClient.scan({
        TableName: tableName,
        ProjectionExpression: 'email, createdAt, apis',
        ... buildFilterParams(options),
      }, (error: AWSError, data: DocumentClient.ScanOutput) => {
        if (error) {
          reject(error);
        } else {
          resolve(data.Items);
        }
      });
    }
  );
};

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

const countApiSignups = (uniqueSignups: AttributeMap[]): ApiSignupCounts => {
  const apiCounts = {
    benefits: 0,
    facilities: 0,
    vaForms: 0,
    confirmation: 0,
    health: 0,
    communityCare: 0,
    verification: 0,
    claims: 0,
  };

  uniqueSignups.forEach((signup: AttributeMap) => {
    const consumerApis = signup.apis.toString().split(',');
    consumerApis.forEach((api: string) => {
      if (!(api in apiCounts)) {
        throw new Error(`Encountered unknown API: ${api}`);
      }

      apiCounts[api]++;
    });
  });

  return apiCounts;
};

export const getFirstTimeSignups = async (options: SignupQueryOptions): Promise<AttributeMap[]> => {
  const signups = await querySignups({
    endDate: options.endDate,
  });

  const signupsByEmail: { [email: string]: AttributeMap } = {};
  signups.forEach((signup: AttributeMap) => {
    const existingSignup = signupsByEmail[signup.email.toString()];
    if (!existingSignup || signup.createdAt < existingSignup.createdAt) {
      signupsByEmail[signup.email.toString()] = signup;
    }
  });

  return filter(signupsByEmail, (signup: AttributeMap) => {
    const startDate = options.startDate || moment('2000');
    const endDate = options.endDate || moment('3000');
    return signup.createdAt >= startDate.toISOString() && signup.createdAt <= endDate.toISOString();
  });
};

export const countSignups = async (options: SignupQueryOptions): Promise<SignupCountResult> => {
  const uniqueSignups: AttributeMap[] = await getFirstTimeSignups(options);
  return {
    total: uniqueSignups.length,
    apiCounts: countApiSignups(uniqueSignups),
  };
};