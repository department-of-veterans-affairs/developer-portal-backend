import { config } from 'aws-sdk';
import commandLineArgs, { OptionDefinition, CommandLineOptions } from 'command-line-args';

import DynamoService from '../services/DynamoService';
import UserService from '../services/UserService';
import UserReportService from '../services/UserReportService';

// CLI Configuration
const cliOptions: OptionDefinition[] = [
  {
    name: 'apis',
    defaultValue: '',
  }
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

config.update({
  region: 'us-gov-west-1'
});

config.update({
  accessKeyId: process.env.DYNAMO_ACCESS_KEY_ID || 'NONE',
  region: process.env.DYNAMO_REGION || 'us-west-2',
  secretAccessKey: process.env.DYNAMO_ACCESS_KEY_SECRET || 'NONE',
  sessionToken: process.env.DYNAMO_SESSION_TOKEN,
});

const dynamoService = new DynamoService({
  httpOptions: {
    timeout: 5000
  },
  maxRetries: 1,
  endpoint: 'http://dynamodb:8000',
});
const userService = new UserService(dynamoService);
const userReportService = new UserReportService(userService);

const parsedApis: string[] = args.apis.split(',');
console.log(parsedApis);
console.log(parsedApis.length);

userReportService.generateCSVReport(parsedApis)
  .then((report: string) => {
    console.log(report);
  })
  .catch((error) => {
    console.log(error);
  });