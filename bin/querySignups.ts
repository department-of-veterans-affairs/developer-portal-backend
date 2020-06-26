import { config } from 'aws-sdk';
import commandLineArgs, { OptionDefinition, CommandLineOptions } from 'command-line-args';
import moment, { Moment } from 'moment';
import { countSignups } from '../utils/signups';

const parseMoment = (argName: string) => {
  return (date: string): Moment => {
    try {
      return moment(date);
    } catch (error) {
      console.error(
        `"${argName}" must be a date string parseable by moment() [https://momentjs.com/docs/#/parsing/]`
      );
      throw error;
    }
  };
};

const cliOptions: OptionDefinition[] = [
  {
    name: 'start',
    alias: 's',
    type: parseMoment('start'),
    defaultValue: moment().subtract(7, 'days'),
  },
  {
    name: 'end',
    alias: 'e',
    type: parseMoment('end'),
    defaultValue: moment(),
  }
];

const printArgs = (args: CommandLineOptions) => {
  console.log("\nArguments:");
  console.log(`   start: ${args.start.toISOString()}`);
  console.log(`   end: ${args.end.toISOString()}\n`);
};

console.log('Running signup query...');
const args: CommandLineOptions = commandLineArgs(cliOptions);
printArgs(args);

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('Must run the signup query utility in an MFA session');
}

config.update({
  region: 'us-gov-west-1',
});

countSignups({
  startDate: args.start,
  endDate: args.end,
}).then(counts => console.log(counts));