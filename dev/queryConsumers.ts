import { config } from 'aws-sdk';
import commandLineArgs, { OptionDefinition, CommandLineOptions } from 'command-line-args';

import DynamoService from '../services/DynamoService';
import ConsumerRepository from '../repository/ConsumerRepository';
import ConsumerReportService from '../services/ConsumerReportService';

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

const dynamoService = new DynamoService({
  httpOptions: {
    timeout: 5000
  },
  maxRetries: 1,
});
const ConsumerRepo = new ConsumerRepository(dynamoService);
const ConsumerReportServ = new ConsumerReportService(ConsumerRepo);

const parsedApis: string[] = args.apis.split(',');
//spot check for empty array with no args, may need to fix that
console.log(parsedApis);
console.log(parsedApis.length);

ConsumerReportServ.generateCSVReport(parsedApis)
  .then((report: string) => {
    console.log(report);
  })
  .catch((error) => {
    console.log(error);
  });