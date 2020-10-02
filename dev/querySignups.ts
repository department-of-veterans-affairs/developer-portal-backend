import { config } from 'aws-sdk';
import commandLineArgs, { OptionDefinition, CommandLineOptions } from 'command-line-args';
import moment, { Moment } from 'moment';
import { sprintf } from 'sprintf-js';
import { APIS_TO_PROPER_NAMES } from '../config/apis';
import SignupMetricsService, { SignupCountResult } from '../services/SignupMetricsService';
import DynamoService from '../services/DynamoService';

const parseMoment = (argName: string) => {
  return (date: string): Moment => {
    const momentArg = moment(date);
    if (!momentArg.isValid()) {
      throw new Error(
        `"${argName}" must be a date string parseable by moment() [https://momentjs.com/docs/#/parsing/]`
      );
    }

    return momentArg;
  };
};

const cliOptions: OptionDefinition[] = [
  {
    name: 'start',
    alias: 's',
    type: parseMoment('start'),
    defaultValue: moment().subtract(7, 'days')
  },
  {
    name: 'end',
    alias: 'e',
    type: parseMoment('end'),
    defaultValue: moment()
  }
];

const printArgs = (args: CommandLineOptions) => {
  console.log('\nArguments:');
  console.log(`   start: ${args.start.toISOString()}`);
  console.log(`   end: ${args.end.toISOString()}\n`);
};

const printResult = (counts: SignupCountResult) => {
  const totalLine = sprintf("%'.-38s %u", 'Total ', counts.total);
  console.log('RESULTS');
  console.log(totalLine);
  console.log('By API');

  Object.keys(counts.apiCounts).forEach((apiId: string) => {
    const formattedLine = sprintf(
      "  %'.-36s %u",
      `${APIS_TO_PROPER_NAMES[apiId]} `,
      counts.apiCounts[apiId]
    );
    console.log(formattedLine);
  });
};

const args: CommandLineOptions = commandLineArgs(cliOptions);
console.log('Running signup query...');
printArgs(args);

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('Must run the signup query utility in an MFA session');
}

config.update({
  region: 'us-gov-west-1'
});

const dynamoService = new DynamoService({
  httpOptions: {
    timeout: 5000
  },
  maxRetries: 1
});
const service = new SignupMetricsService(dynamoService);
service
  .countSignups({
    startDate: args.start,
    endDate: args.end
  })
  .then((counts: SignupCountResult) => printResult(counts));
