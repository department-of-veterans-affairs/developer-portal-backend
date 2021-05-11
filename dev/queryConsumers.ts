import { config } from 'aws-sdk';
import commandLineArgs, { OptionDefinition, CommandLineOptions } from 'command-line-args';

import DynamoService from '../services/DynamoService';
import ConsumerRepository from '../repositories/ConsumerRepository';
import ConsumerReportService, { OutputType } from '../services/ConsumerReportService';

const parseArray = (array: string): string[] => array ? array.split(',') : [];
// Brute force check that the string matches an output type - maybe a better way to do this
const isCsvOutputType = (str: string) => (
  str === 'email' ||
  str === 'firstName' ||
  str === 'lastName' ||
  str === 'apis'
);
const parseOutputTypeArray = (array: string): OutputType[] => {
  const stringArray = parseArray(array);
  const outputTypes: OutputType[] = [];
  stringArray.forEach((item) => {
    if (isCsvOutputType(item)) {
      outputTypes.push(item as OutputType);
    } else {
      console.error(`${item} is not a valid csv output option! It will be ignored`);
    }
  });

  return outputTypes;
}

// CLI Configuration
const cliOptions: OptionDefinition[] = [
  {
    name: 'apis',
    alias: 'a',
    defaultValue: '',
  },
  {
    name: 'oktaApplicationIds',
    alias: 'i',
    defaultValue: '',
  },
  {
    name: 'fields',
    alias: 'f',
    defaultValue: 'email,firstName,lastName,apis',
  },
];

const printArgs = (args: CommandLineOptions) => {
  console.log('\nArguments:');
  console.log(`   apis: ${args.apis}`);
  console.log(`   okta application ids: ${args.oktaApplicationIds}`);
};

const args: CommandLineOptions = commandLineArgs(cliOptions);
console.log('Running consumer query...');
printArgs(args);

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('Must run the consumer report utility in an MFA session');
}

process.env.DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'dvp-prod-developer-portal-users';

config.update({
  region: 'us-gov-west-1'
});

const dynamoService = new DynamoService({
  httpOptions: {
    timeout: 5000
  },
  maxRetries: 1,
});
const consumerRepo = new ConsumerRepository(dynamoService);
const consumerReportService = new ConsumerReportService(consumerRepo);

const csvReportOptions = {
  apiList: parseArray(args.apis),
  oktaApplicationIdList: parseArray(args.oktaApplicationIds),
  writeToDisk: true,
  fields: parseOutputTypeArray(args.fields),
}

consumerReportService.generateCSVReport(csvReportOptions)
  .then((report: string) => {
    console.log('====================');
    console.log(report);
  })
  .catch((error) => {
    console.log('====================');
    console.log(error);
  });