import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  DeleteCommand,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { Room, UpdateRoom } from '../types/room';

// Configure DynamoDB client for local or AWS
const isLocal = !!process.env.DYNAMODB_ENDPOINT;

const clientConfig: any = {
  region: process.env.AWS_REGION || 'us-west-2',
};

// For local development, use fake credentials and local endpoint
if (isLocal) {
  clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
  clientConfig.credentials = {
    accessKeyId: 'fakeMyKeyId',
    secretAccessKey: 'fakeSecretAccessKey',
  };
}

const client = new DynamoDBClient(clientConfig);

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'Rooms';

export class DynamoDBService {
  /**
   * Get all rooms from DynamoDB
   */
  async getAllRooms(): Promise<Room[]> {
    try {
      const command = new ScanCommand({
        TableName: TABLE_NAME,
      });

      const response = await docClient.send(command);
      return (response.Items || []) as Room[];
    } catch (error) {
      console.error('Error scanning DynamoDB:', error);
      throw new Error('Failed to retrieve rooms from database');
    }
  }

  /**
   * Add a new room to DynamoDB
   */
  async addRoom(room: Room): Promise<Room> {
    try {
      // Set defaults for new fields
      const roomWithDefaults: Room = {
        ...room,
        status: room.status || 'available',
        capacity: room.capacity || 2,
      };

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: roomWithDefaults,
      });

      await docClient.send(command);
      return roomWithDefaults;
    } catch (error) {
      console.error('Error putting item to DynamoDB:', error);
      throw new Error('Failed to add room to database');
    }
  }

  /**
   * Update a room in DynamoDB
   */
  async updateRoom(id: number, updates: UpdateRoom): Promise<Room> {
    try {
      // First check if the room exists
      const getCommand = new GetCommand({
        TableName: TABLE_NAME,
        Key: { id },
      });

      const getResponse = await docClient.send(getCommand);
      
      if (!getResponse.Item) {
        throw new Error('Room not found');
      }

      // Build update expression
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      if (updates.floor !== undefined) {
        updateExpressions.push('#floor = :floor');
        expressionAttributeNames['#floor'] = 'floor';
        expressionAttributeValues[':floor'] = updates.floor;
      }

      if (updates.hasView !== undefined) {
        updateExpressions.push('#hasView = :hasView');
        expressionAttributeNames['#hasView'] = 'hasView';
        expressionAttributeValues[':hasView'] = updates.hasView;
      }

      if (updates.status !== undefined) {
        updateExpressions.push('#status = :status');
        expressionAttributeNames['#status'] = 'status';
        expressionAttributeValues[':status'] = updates.status;
      }

      if (updates.capacity !== undefined) {
        updateExpressions.push('#capacity = :capacity');
        expressionAttributeNames['#capacity'] = 'capacity';
        expressionAttributeValues[':capacity'] = updates.capacity;
      }

      const updateCommand = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      });

      const updateResponse = await docClient.send(updateCommand);
      return updateResponse.Attributes as Room;
    } catch (error) {
      if (error instanceof Error && error.message === 'Room not found') {
        throw error;
      }
      console.error('Error updating item in DynamoDB:', error);
      throw new Error('Failed to update room in database');
    }
  }

  /**
   * Delete a room from DynamoDB
   */
  async deleteRoom(id: number): Promise<void> {
    try {
      // First check if the room exists
      const getCommand = new GetCommand({
        TableName: TABLE_NAME,
        Key: { id },
      });

      const getResponse = await docClient.send(getCommand);
      
      if (!getResponse.Item) {
        throw new Error('Room not found');
      }

      // Delete the room
      const deleteCommand = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { id },
      });

      await docClient.send(deleteCommand);
    } catch (error) {
      if (error instanceof Error && error.message === 'Room not found') {
        throw error;
      }
      console.error('Error deleting item from DynamoDB:', error);
      throw new Error('Failed to delete room from database');
    }
  }
}

export const dynamoDBService = new DynamoDBService();
