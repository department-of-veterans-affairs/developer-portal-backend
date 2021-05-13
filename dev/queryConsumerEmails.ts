import { config } from 'aws-sdk';
import commandLineArgs, { OptionDefinition, CommandLineOptions } from 'command-line-args';
import fs from 'fs';
import DynamoService from '../services/DynamoService';
import ConsumerRepository from '../repositories/ConsumerRepository';
import ObjectsToCsv from 'objects-to-csv';
import { UserDynamoItem } from '../models/User';
import { mergeUserDynamoItems } from '../util/merge-user-dynamo-items';

// CLI Configuration
const cliOptions: OptionDefinition[] = [
  {
    name: 'oktaIds',
    alias: 'i',
    defaultValue: '',
  },
  {
    name: 'idDelimiter',
    alias: 'd',
    defaultValue: ',',
  },
  {
    name: 'outputFile',
    alias: 'o',
    defaultValue: '',
  },
];

const printArgs = (args: CommandLineOptions) => {
  console.log('\nArguments:');
  console.log(`   okta ids: ${args.oktaIds}`);
  console.log(`   delimiter: ${args.idDelimiter}`);
  console.log(`   output file: ${args.outputFile}`);
};

const args: CommandLineOptions = commandLineArgs(cliOptions);
console.log('Running consumer email query...');
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
const parsedOktaIds: string[] = args.oktaIds ? args.oktaIds.split(args.idDelimiter) : [];

// We need to set a max amount of ids in a request because the Dynamo Filter
// Expression only allows a 4KB expression
const MAX_OKTA_IDS_IN_REQUEST = 60;
const numRequests = Math.ceil(parsedOktaIds.length / MAX_OKTA_IDS_IN_REQUEST);

console.log(`There will be ${numRequests} requests made to DynamoDB`);

const doRequests = async() => {
  let allDynamoItems: UserDynamoItem[] = [];

  for (let i = 0; i < numRequests; i++) {
    const oktaIdChunk = parsedOktaIds.slice(
      i * MAX_OKTA_IDS_IN_REQUEST,
      (i + 1) * MAX_OKTA_IDS_IN_REQUEST,
    );
    console.log(`Making request ${i} for ids: ${oktaIdChunk}`);
    const users = await consumerRepo.getConsumers(undefined, oktaIdChunk);
    allDynamoItems = allDynamoItems.concat(users);
  }


  console.log(`Found ${allDynamoItems.length} dynamo item(s)`);
  const uniqueDynamoItems = mergeUserDynamoItems(allDynamoItems);
  console.log(`${uniqueDynamoItems.length} unique emails found`);
  const data = uniqueDynamoItems.map(dynamoItem => (
    {
      email: dynamoItem.email,
      oktaId: dynamoItem.okta_application_id,
    }
  ));

  const csv = new ObjectsToCsv(data);
  const csvString = await csv.toString();
  console.log('====================');

  const { outputFile } = args;
  if (outputFile) {
    let outputPath = outputFile;
    if (!outputFile.endsWith('.csv')) {
      outputPath += '.csv';
    }
    fs.writeFileSync(outputPath, csvString);
    console.log(`Wrote output to ${outputPath}`);
  } else {
    console.log(csvString);
  }
}

void doRequests();
