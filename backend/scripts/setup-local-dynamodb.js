#!/usr/bin/env node

/**
 * Script to set up local DynamoDB table for development
 * Run this after starting DynamoDB Local with docker-compose
 */

const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  region: 'fakeRegion',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'fakeMyKeyId',
    secretAccessKey: 'fakeSecretAccessKey',
  },
});

const TABLE_NAME = 'Rooms-local';

async function setupTable() {
  try {
    // Check if table already exists
    const listCommand = new ListTablesCommand({});
    const listResponse = await client.send(listCommand);
    
    if (listResponse.TableNames && listResponse.TableNames.includes(TABLE_NAME)) {
      console.log(`✓ Table "${TABLE_NAME}" already exists`);
      return;
    }

    // Create table
    const createCommand = new CreateTableCommand({
      TableName: TABLE_NAME,
      AttributeDefinitions: [
        {
          AttributeName: 'id',
          AttributeType: 'N',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'id',
          KeyType: 'HASH',
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    });

    await client.send(createCommand);
    console.log(`✓ Created table "${TABLE_NAME}"`);
    
    // Add some sample data
    const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
    const docClient = DynamoDBDocumentClient.from(client);
    
    const sampleRooms = [
      { id: 101, floor: 1, hasView: true, status: 'available', capacity: 2 },
      { id: 102, floor: 1, hasView: false, status: 'occupied', capacity: 1 },
      { id: 201, floor: 2, hasView: true, status: 'available', capacity: 4 },
      { id: 202, floor: 2, hasView: true, status: 'maintenance', capacity: 2 },
    ];

    for (const room of sampleRooms) {
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: room,
      }));
    }
    
    console.log(`✓ Added ${sampleRooms.length} sample rooms`);
    console.log('\nLocal DynamoDB setup complete! 🎉');
    console.log(`Table: ${TABLE_NAME}`);
    console.log('Endpoint: http://localhost:8000');
    
  } catch (error) {
    if (error.name === 'NetworkingError' || error.code === 'ECONNREFUSED') {
      console.error('\n❌ Error: Could not connect to DynamoDB Local');
      console.error('Make sure DynamoDB Local is running:');
      console.error('  npm run dev:dynamodb\n');
    } else {
      console.error('\n❌ Error setting up DynamoDB:', error.message);
    }
    process.exit(1);
  }
}

setupTable();
