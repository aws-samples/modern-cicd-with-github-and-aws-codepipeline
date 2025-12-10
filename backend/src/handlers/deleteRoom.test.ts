import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from './deleteRoom';
import { dynamoDBService } from '../services/dynamodb';

// Mock the DynamoDB service
jest.mock('../services/dynamodb');

describe('deleteRoom handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a room successfully', async () => {
    const mockEvent = {
      pathParameters: { id: '101' },
    } as unknown as APIGatewayProxyEvent;

    (dynamoDBService.deleteRoom as jest.Mock).mockResolvedValue(undefined);

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({
      message: 'Room deleted successfully',
      id: 101,
    });
    expect(dynamoDBService.deleteRoom).toHaveBeenCalledWith(101);
  });

  it('should return 400 if room ID is missing', async () => {
    const mockEvent = {
      pathParameters: null,
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Room ID is required',
    });
    expect(dynamoDBService.deleteRoom).not.toHaveBeenCalled();
  });

  it('should return 400 if room ID is not a valid number', async () => {
    const mockEvent = {
      pathParameters: { id: 'abc' },
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Room ID must be a positive number',
    });
    expect(dynamoDBService.deleteRoom).not.toHaveBeenCalled();
  });

  it('should return 400 if room ID is negative', async () => {
    const mockEvent = {
      pathParameters: { id: '-5' },
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Room ID must be a positive number',
    });
    expect(dynamoDBService.deleteRoom).not.toHaveBeenCalled();
  });

  it('should return 404 if room is not found', async () => {
    const mockEvent = {
      pathParameters: { id: '999' },
    } as unknown as APIGatewayProxyEvent;

    (dynamoDBService.deleteRoom as jest.Mock).mockRejectedValue(
      new Error('Room not found')
    );

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Room not found',
    });
  });

  it('should return 500 on database error', async () => {
    const mockEvent = {
      pathParameters: { id: '101' },
    } as unknown as APIGatewayProxyEvent;

    (dynamoDBService.deleteRoom as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Failed to delete room',
    });
  });
});
