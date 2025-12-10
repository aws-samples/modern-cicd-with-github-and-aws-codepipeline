import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from './getRooms';
import { dynamoDBService } from '../services/dynamodb';
import { Room } from '../types/room';

jest.mock('../services/dynamodb');

describe('getRooms handler', () => {
  const mockEvent = {} as APIGatewayProxyEvent;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all rooms from DynamoDB', async () => {
    const mockRooms: Room[] = [
      { id: 101, floor: 1, hasView: true },
      { id: 102, floor: 1, hasView: false },
    ];

    (dynamoDBService.getAllRooms as jest.Mock).mockResolvedValue(mockRooms);

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(200);
    expect(result.headers).toHaveProperty('Access-Control-Allow-Origin');
    
    const body = JSON.parse(result.body);
    expect(body.rooms).toEqual(mockRooms);
    expect(body.rooms).toHaveLength(2);
  });

  it('should return empty array when no rooms exist', async () => {
    (dynamoDBService.getAllRooms as jest.Mock).mockResolvedValue([]);

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.rooms).toEqual([]);
  });

  it('should return 500 when DynamoDB fails', async () => {
    (dynamoDBService.getAllRooms as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Failed to retrieve rooms');
  });

  it('should include CORS headers in error response', async () => {
    (dynamoDBService.getAllRooms as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await handler(mockEvent);

    expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    expect(result.headers).toHaveProperty('Content-Type', 'application/json');
  });
});
