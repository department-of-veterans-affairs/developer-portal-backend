const { config, DynamoDB } = require('aws-sdk')

config.update({
  accessKeyId: 'NONE',
  region: 'us-west-2',
  secretAccessKey: 'NONE',
})

const dynamo = new DynamoDB({
  endpoint: process.env.DYNAMODB_ENDPOINT,
})

const tableParams = {
  AttributeDefinitions: [
    { AttributeName: 'createdAt', AttributeType: 'S' },
    { AttributeName: 'email', AttributeType: 'S' },
  ],
  KeySchema: [
    { AttributeName: 'email', KeyType: 'HASH' },
    { AttributeName: 'createdAt', KeyType: 'RANGE' },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 10,
    WriteCapacityUnits: 10,
  },
  TableName: process.env.DYNAMODB_TABLE || 'Users',
}

dynamo.createTable(tableParams, (err, data) => {
  if (err) {
    console.error('Unable to create table. Error JSON:', JSON.stringify(err, null, 2))
  } else {
    console.log('Created table. Table description JSON:', JSON.stringify(data, null, 2))
  }
})
