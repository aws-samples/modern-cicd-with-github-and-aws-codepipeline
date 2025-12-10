/**
 * Feature: serverless-migration, Property 1: Room list completeness
 * Validates: Requirements 2.1
 * 
 * For any set of rooms stored in DynamoDB, when the GET /api/rooms endpoint is called,
 * all rooms should be returned in the response.
 */

import * as fc from 'fast-check';
import { handler } from './getRooms';
import { dynamoDBService } from '../services/dynamodb';
import { Room } from '../types/room';
import { APIGatewayProxyEvent } from 'aws-lambda';

jest.mock('../services/dynamodb');

describe('Property 1: Room list completeness', () => {
  const roomArbitrary = fc.record({
    id: fc.integer({ min: 1, max: 9999 }),
    floor: fc.integer({ min: 1, max: 100 }),
    hasView: fc.boolean(),
  });

  it('should return all rooms from DynamoDB for any set of rooms', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(roomArbitrary, { minLength: 0, maxLength: 50 }), async (rooms: Room[]) => {
        // Mock DynamoDB to return the generated rooms
        (dynamoDBService.getAllRooms as jest.Mock).mockResolvedValue(rooms);

        const mockEvent = {} as APIGatewayProxyEvent;
        const result = await handler(mockEvent);

        // Verify response
        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        
        // All rooms should be returned
        expect(body.rooms).toHaveLength(rooms.length);
        expect(body.rooms).toEqual(rooms);
      }),
      { numRuns: 100 }
    );
  });
});
