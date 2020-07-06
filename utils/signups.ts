import { AWSError } from 'aws-sdk';
import { AttributeMap, DocumentClient, ScanInput } from 'aws-sdk/clients/dynamodb';
import { Moment } from 'moment';

const DEFAULT_TABLE = 'dvp-prod-developer-portal-users';

export interface SignupQueryOptions {
  startDate?: Moment;
  endDate?: Moment;
}

export interface Signup {
  email: string;
  createdAt: string;
  apis: string;
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

const mapItemsToSignups = (items: AttributeMap[]): Signup[] => {
  return items.map(item => {
    return { 
      email: item.email.toString(),
      createdAt: item.createdAt.toString(),
      apis: item.apis.toString(),
    };
  });
};

export const querySignups = (options: SignupQueryOptions = {}): Promise<Signup[]> => {
  const tableName = process.env.DYNAMODB_TABLE || DEFAULT_TABLE;
  const dynamoClient = new DocumentClient({
    httpOptions: {
      timeout: 5000,
    },
    maxRetries: 1,
  });

  return new Promise<Signup[]>(
    (resolve, reject) => {
      dynamoClient.scan({
        TableName: tableName,
        ProjectionExpression: 'email, createdAt, apis',
        ... buildFilterParams(options),
      }, (error: AWSError, data: DocumentClient.ScanOutput) => {
        if (error) {
          reject(error);
        } else {
          const signups: Signup[] = mapItemsToSignups(data.Items || []);
          resolve(signups);
        }
      });
    }
  );
};

export const getUniqueSignups = async (options: SignupQueryOptions): Promise<Signup[]> => {
  const signups = await querySignups(options);
  const signupsByEmail: { [email: string]: Signup } = {};
  const apisByEmail: { [email: string]: Set<string> } = {};

  signups.forEach((signup: Signup) => {
    const existingSignup = signupsByEmail[signup.email.toString()];
    if (!existingSignup || signup.createdAt < existingSignup.createdAt) {
      signupsByEmail[signup.email] = signup;
      apisByEmail[signup.email] = new Set<string>();
    }

    signup.apis.toString().split(',').forEach((apiId: string) => {
      apisByEmail[signup.email].add(apiId);
    });
  });
  
  const uniqueSignups = Object.values(signupsByEmail);
  uniqueSignups.forEach((signup: Signup) => {
    signup.apis = [... apisByEmail[signup.email]].sort().join(',');
  });
  
  return uniqueSignups;
};

export const getPreviousSignups = (signup: Signup): Promise<Signup[]> => {
  // todo extract, preferably once we go to a service (also in querySignups)
  const tableName = process.env.DYNAMODB_TABLE || DEFAULT_TABLE;
  const dynamoClient = new DocumentClient({
    httpOptions: {
      timeout: 5000,
    },
    maxRetries: 1,
  });
  
  return new Promise<Signup[]>((resolve, reject) => {
    dynamoClient.query({
      TableName: tableName,
      ExpressionAttributeValues: {
        ':email': signup.email,
        ':signupDate': signup.createdAt,
      },
      KeyConditionExpression: 'email = :email and createdAt < :signupDate'
    }, (error: AWSError, data: DocumentClient.QueryOutput) => {
      if (error) {
        reject(error);
      } else {
        resolve(mapItemsToSignups(data.Items || []));
      }
    });
  });
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
  
export const countSignups = async (options: SignupQueryOptions): Promise<SignupCountResult> => {
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
      claims: 0,
    },
  };

  const uniqueSignups: Signup[] = await getUniqueSignups(options);
  for (let i = 0; i < uniqueSignups.length; i++) {
    const previousSignups = await getPreviousSignups(uniqueSignups[i]);
    const newApis = new Set<string>(uniqueSignups[i].apis.split(','));
    if (previousSignups.length === 0) {
      result.total++;
    } else {
      previousSignups.forEach((signup: Signup) => {
        signup.apis.split(',').forEach((apiId: string) => {
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
};