import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from './addRoom';
import { dynamoDBService } from '../services/dynamodb';
import { Room } from '../types/room';

jest.mock('../services/dynamodb');

describe('addRoom handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a room with valid data', async () => {
    const newRoomData = {
      roomNumber: 301,
      floorNumber: 3,
      hasView: true,
    };

    const expectedRoom: Room = {
      id: 301,
      floor: 3,
      hasView: true,
    };

    (dynamoDBService.addRoom as jest.Mock).mockResolvedValue(expectedRoom);

    const event = {
      body: JSON.stringify(newRoomData),
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.room).toEqual(expectedRoom);
    expect(dynamoDBService.addRoom).toHaveBeenCalledWith(expectedRoom);
  });

  it('should reject request without body', async () => {
    const event = {
      body: null,
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Request body is required');
  });

  it('should reject invalid JSON', async () => {
    const event = {
      body: 'invalid json',
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Invalid JSON in request body');
  });

  it('should reject invalid room data - missing roomNumber', async () => {
    const invalidData = {
      floorNumber: 3,
      hasView: true,
    };

    const event = {
      body: JSON.stringify(invalidData),
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Validation failed');
    expect(body.details).toBeDefined();
  });

  it('should reject invalid room data - negative roomNumber', async () => {
    const invalidData = {
      roomNumber: -1,
      floorNumber: 3,
      hasView: true,
    };

    const event = {
      body: JSON.stringify(invalidData),
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Validation failed');
  });

  it('should reject invalid room data - non-integer roomNumber', async () => {
    const invalidData = {
      roomNumber: 3.5,
      floorNumber: 3,
      hasView: true,
    };

    const event = {
      body: JSON.stringify(invalidData),
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Validation failed');
  });

  it('should reject invalid room data - invalid hasView type', async () => {
    const invalidData = {
      roomNumber: 301,
      floorNumber: 3,
      hasView: 'yes',
    };

    const event = {
      body: JSON.stringify(invalidData),
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Validation failed');
  });

  it('should return 500 when DynamoDB fails', async () => {
    const newRoomData = {
      roomNumber: 301,
      floorNumber: 3,
      hasView: true,
    };

    (dynamoDBService.addRoom as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const event = {
      body: JSON.stringify(newRoomData),
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Failed to add room');
  });

  it('should include CORS headers in all responses', async () => {
    const newRoomData = {
      roomNumber: 301,
      floorNumber: 3,
      hasView: true,
    };

    (dynamoDBService.addRoom as jest.Mock).mockResolvedValue({
      id: 301,
      floor: 3,
      hasView: true,
    });

    const event = {
      body: JSON.stringify(newRoomData),
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    expect(result.headers).toHaveProperty('Content-Type', 'application/json');
  });
});
