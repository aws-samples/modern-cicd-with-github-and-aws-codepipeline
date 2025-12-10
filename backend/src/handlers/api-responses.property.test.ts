/**
 * Feature: serverless-migration, Property 9: API responses are valid JSON
 * Validates: Requirements 10.2
 * 
 * For any API endpoint response (success or error), the response body should be valid JSON.
 */

import * as fc from 'fast-check';
import { handler as getConfigHandler } from './getConfig';
import { handler as getRoomsHandler } from './getRooms';
import { handler as addRoomHandler } from './addRoom';
import { dynamoDBService } from '../services/dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { Room } from '../types/room';

jest.mock('../services/dynamodb');

describe('Property 9: API responses are valid JSON', () => {
  it('getConfig should always return valid JSON', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (hotelName) => {
        const originalHotelName = process.env.HOTEL_NAME;
        process.env.HOTEL_NAME = hotelName;

        const mockEvent = {} as APIGatewayProxyEvent;
        const result = await getConfigHandler(mockEvent);

        // Should be able to parse as JSON without throwing
        expect(() => JSON.parse(result.body)).not.toThrow();
        
        const body = JSON.parse(result.body);
        expect(body).toBeDefined();

        if (originalHotelName) {
          process.env.HOTEL_NAME = originalHotelName;
        } else {
          delete process.env.HOTEL_NAME;
        }
      }),
      { numRuns: 100 }
    );
  });

  it('getRooms should always return valid JSON for success', async () => {
    const roomArbitrary = fc.record({
      id: fc.integer({ min: 1, max: 9999 }),
      floor: fc.integer({ min: 1, max: 100 }),
      hasView: fc.boolean(),
    });

    await fc.assert(
      fc.asyncProperty(fc.array(roomArbitrary, { maxLength: 50 }), async (rooms: Room[]) => {
        (dynamoDBService.getAllRooms as jest.Mock).mockResolvedValue(rooms);

        const mockEvent = {} as APIGatewayProxyEvent;
        const result = await getRoomsHandler(mockEvent);

        // Should be able to parse as JSON without throwing
        expect(() => JSON.parse(result.body)).not.toThrow();
        
        const body = JSON.parse(result.body);
        expect(body).toBeDefined();
        expect(body.rooms).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it('getRooms should return valid JSON for errors', async () => {
    (dynamoDBService.getAllRooms as jest.Mock).mockRejectedValue(new Error('Database error'));

    const mockEvent = {} as APIGatewayProxyEvent;
    const result = await getRoomsHandler(mockEvent);

    // Should be able to parse as JSON without throwing
    expect(() => JSON.parse(result.body)).not.toThrow();
    
    const body = JSON.parse(result.body);
    expect(body).toBeDefined();
    expect(body.error).toBeDefined();
  });

  it('addRoom should always return valid JSON for valid input', async () => {
    const validRoomArbitrary = fc.record({
      roomNumber: fc.integer({ min: 1, max: 9999 }),
      floorNumber: fc.integer({ min: 1, max: 100 }),
      hasView: fc.boolean(),
    });

    await fc.assert(
      fc.asyncProperty(validRoomArbitrary, async (newRoomData) => {
        const expectedRoom: Room = {
          id: newRoomData.roomNumber,
          floor: newRoomData.floorNumber,
          hasView: newRoomData.hasView,
        };

        (dynamoDBService.addRoom as jest.Mock).mockResolvedValue(expectedRoom);

        const event = {
          body: JSON.stringify(newRoomData),
        } as APIGatewayProxyEvent;

        const result = await addRoomHandler(event);

        // Should be able to parse as JSON without throwing
        expect(() => JSON.parse(result.body)).not.toThrow();
        
        const body = JSON.parse(result.body);
        expect(body).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it('addRoom should return valid JSON for invalid input', async () => {
    const event = {
      body: JSON.stringify({ invalid: 'data' }),
    } as APIGatewayProxyEvent;

    const result = await addRoomHandler(event);

    // Should be able to parse as JSON without throwing
    expect(() => JSON.parse(result.body)).not.toThrow();
    
    const body = JSON.parse(result.body);
    expect(body).toBeDefined();
    expect(body.error).toBeDefined();
  });
});


/**
 * Feature: serverless-migration, Property 10: Error responses include proper status codes
 * Validates: Requirements 10.3
 * 
 * For any error condition (validation error, not found, server error),
 * the API should return an appropriate HTTP status code (400, 404, 500)
 * and an error message in the response body.
 */

describe('Property 10: Error responses include proper status codes', () => {
  it('should return 400 for validation errors', async () => {
    const invalidDataArbitrary = fc.oneof(
      // Missing fields
      fc.record({
        floorNumber: fc.integer({ min: 1, max: 100 }),
        hasView: fc.boolean(),
      }),
      // Negative values
      fc.record({
        roomNumber: fc.integer({ max: 0 }),
        floorNumber: fc.integer({ min: 1, max: 100 }),
        hasView: fc.boolean(),
      }),
      // Wrong types
      fc.record({
        roomNumber: fc.integer({ min: 1, max: 9999 }),
        floorNumber: fc.integer({ min: 1, max: 100 }),
        hasView: fc.string(),
      })
    );

    await fc.assert(
      fc.asyncProperty(invalidDataArbitrary, async (invalidData) => {
        const event = {
          body: JSON.stringify(invalidData),
        } as APIGatewayProxyEvent;

        const result = await addRoomHandler(event);

        // Should return 400 for validation errors
        expect(result.statusCode).toBe(400);
        
        const body = JSON.parse(result.body);
        expect(body.error).toBeDefined();
        expect(typeof body.error).toBe('string');
      }),
      { numRuns: 100 }
    );
  });

  it('should return 400 for invalid JSON', async () => {
    const event = {
      body: 'not valid json {',
    } as APIGatewayProxyEvent;

    const result = await addRoomHandler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBeDefined();
  });

  it('should return 400 for missing body', async () => {
    const event = {
      body: null,
    } as APIGatewayProxyEvent;

    const result = await addRoomHandler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBeDefined();
  });

  it('should return 500 for database errors', async () => {
    const validRoomArbitrary = fc.record({
      roomNumber: fc.integer({ min: 1, max: 9999 }),
      floorNumber: fc.integer({ min: 1, max: 100 }),
      hasView: fc.boolean(),
    });

    await fc.assert(
      fc.asyncProperty(validRoomArbitrary, async (newRoomData) => {
        // Simulate database error
        (dynamoDBService.addRoom as jest.Mock).mockRejectedValue(new Error('Database error'));

        const event = {
          body: JSON.stringify(newRoomData),
        } as APIGatewayProxyEvent;

        const result = await addRoomHandler(event);

        // Should return 500 for server errors
        expect(result.statusCode).toBe(500);
        
        const body = JSON.parse(result.body);
        expect(body.error).toBeDefined();
        expect(typeof body.error).toBe('string');
      }),
      { numRuns: 100 }
    );
  });

  it('should return 500 when getRooms fails', async () => {
    (dynamoDBService.getAllRooms as jest.Mock).mockRejectedValue(new Error('Database error'));

    const mockEvent = {} as APIGatewayProxyEvent;
    const result = await getRoomsHandler(mockEvent);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toBeDefined();
  });
});
