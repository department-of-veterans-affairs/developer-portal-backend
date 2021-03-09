export const DEFAULT_TABLE = 'dvp-prod-developer-portal-users';
export const ENVIRONMENTS = {
  'dvp-dev-developer-portal-users': 'Development',
  'dvp-prod-developer-portal-users': 'Production',
  'dvp-staging-developer-portal-users': 'Staging',
  'fake-users-table': 'Test',
};

export const getEnvironment = (): string => {
  if (process.env.DYNAMODB_TABLE) {
    return ENVIRONMENTS[process.env.DYNAMODB_TABLE] as string;
  }

  return ENVIRONMENTS[DEFAULT_TABLE];
};

