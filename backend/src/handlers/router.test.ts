import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from './router';

// Mock all the individual handlers
jest.mock('./getConfig');
jest.mock('./getRooms');
jest.mock('./addRoom');
jest.mock('./deleteRoom');
jest.mock('./debug');

import { handler as getConfigHandler } from './getConfig';
import { handler as getRoomsHandler } from './getRooms';
import { handler as addRoomHandler } from './addRoom';
import { handler as deleteRoomHandler } from './deleteRoom';
import { handler as debugHandler } from './debug';

describe('Router handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should route GET /api/config to getConfig handler', async () => {
    const mockEvent = {
      httpMethod: 'GET',
      path: '/api/config',
    } as APIGatewayProxyEvent;

    const mockResponse = { statusCode: 200, body: '{}' };
    (getConfigHandler as jest.Mock).mockResolvedValue(mockResponse);

    const result = await handler(mockEvent);

    expect(getConfigHandler).toHaveBeenCalledWith(mockEvent);
    expect(result).toEqual(mockResponse);
  });

  it('should route GET /api/debug to debug handler', async () => {
    const mockEvent = {
      httpMethod: 'GET',
      path: '/api/debug',
    } as APIGatewayProxyEvent;

    const mockResponse = { statusCode: 200, body: '{}' };
    (debugHandler as jest.Mock).mockResolvedValue(mockResponse);

    const result = await handler(mockEvent);

    expect(debugHandler).toHaveBeenCalledWith(mockEvent);
    expect(result).toEqual(mockResponse);
  });

  it('should route GET /api/rooms to getRooms handler', async () => {
    const mockEvent = {
      httpMethod: 'GET',
      path: '/api/rooms',
    } as APIGatewayProxyEvent;

    const mockResponse = { statusCode: 200, body: '{}' };
    (getRoomsHandler as jest.Mock).mockResolvedValue(mockResponse);

    const result = await handler(mockEvent);

    expect(getRoomsHandler).toHaveBeenCalledWith(mockEvent);
    expect(result).toEqual(mockResponse);
  });

  it('should route POST /api/rooms to addRoom handler', async () => {
    const mockEvent = {
      httpMethod: 'POST',
      path: '/api/rooms',
      body: '{"roomNumber": 101, "floorNumber": 1, "hasView": true}',
    } as APIGatewayProxyEvent;

    const mockResponse = { statusCode: 201, body: '{}' };
    (addRoomHandler as jest.Mock).mockResolvedValue(mockResponse);

    const result = await handler(mockEvent);

    expect(addRoomHandler).toHaveBeenCalledWith(mockEvent);
    expect(result).toEqual(mockResponse);
  });

  it('should route DELETE /api/rooms/{id} to deleteRoom handler', async () => {
    const mockEvent = {
      httpMethod: 'DELETE',
      path: '/api/rooms/101',
    } as unknown as APIGatewayProxyEvent;

    const mockResponse = { statusCode: 200, body: '{}' };
    (deleteRoomHandler as jest.Mock).mockResolvedValue(mockResponse);

    const result = await handler(mockEvent);

    // Router should extract ID from path and add to pathParameters
    expect(deleteRoomHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        pathParameters: { id: '101' },
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('should return 404 for unknown routes', async () => {
    const mockEvent = {
      httpMethod: 'GET',
      path: '/api/unknown',
    } as APIGatewayProxyEvent;

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Route not found: GET /api/unknown',
    });
  });

  it('should return 404 for unsupported methods', async () => {
    const mockEvent = {
      httpMethod: 'PUT',
      path: '/api/rooms',
    } as APIGatewayProxyEvent;

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Route not found: PUT /api/rooms',
    });
  });

  it('should handle errors from handlers', async () => {
    const mockEvent = {
      httpMethod: 'GET',
      path: '/api/rooms',
    } as APIGatewayProxyEvent;

    (getRoomsHandler as jest.Mock).mockRejectedValue(new Error('Database error'));

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Internal server error',
    });
  });
});
