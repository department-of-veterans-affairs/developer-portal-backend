import { config } from 'aws-sdk';
import commandLineArgs, { OptionDefinition, CommandLineOptions } from 'command-line-args';

import DynamoService from '../services/DynamoService';
import ConsumerRepository from '../repositories/ConsumerRepository';
import ConsumerReportService from '../services/ConsumerReportService';
import { DEFAULT_TABLE } from '../util/environments';

// CLI Configuration
const cliOptions: OptionDefinition[] = [
  {
    name: 'apis',
    defaultValue: '',
  },
];

const printArgs = (args: CommandLineOptions) => {
  console.log('\nArguments:');
  console.log(`   apis: ${args.apis}`);
};

const args: CommandLineOptions = commandLineArgs(cliOptions);
console.log('Running consumer query...');
printArgs(args);

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('Must run the consumer report utility in an MFA session');
}

process.env.DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || DEFAULT_TABLE;

config.update({
  region: 'us-gov-west-1',
});

const dynamoService = new DynamoService({
  httpOptions: {
    timeout: 5000,
  },
  maxRetries: 1,
});
const consumerRepo = new ConsumerRepository(dynamoService);
const consumerReportService = new ConsumerReportService(consumerRepo);

const parsedApis: string[] = args.apis ? args.apis.split(',') : [];

consumerReportService
  .generateCSVReport({ apiList: parsedApis, writeToDisk: true })
  .then((report: string) => {
    console.log(report);
  })
  .catch(error => {
    console.log(error);
  });
