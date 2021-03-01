import { DEFAULT_TABLE, ENVIRONMENTS } from "./environments";

export const getEnvironment = (): string => {
  if (process.env.DYNAMODB_TABLE) {
    return ENVIRONMENTS[process.env.DYNAMODB_TABLE] as string;
  }

  return ENVIRONMENTS[DEFAULT_TABLE];
};
