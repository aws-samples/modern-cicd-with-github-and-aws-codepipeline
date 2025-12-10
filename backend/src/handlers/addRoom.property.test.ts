/**
 * Feature: serverless-migration, Property 2: Room creation persistence
 * Validates: Requirements 2.2
 * 
 * For any valid room data (with roomNumber, floorNumber, and hasView),
 * when POST /api/rooms is called, the room should be stored in DynamoDB
 * and retrievable via GET /api/rooms.
 */

import * as fc from 'fast-check';
import { handler as addRoomHandler } from './addRoom';
import { handler as getRoomsHandler } from './getRooms';
import { dynamoDBService } from '../services/dynamodb';
import { Room } from '../types/room';
import { APIGatewayProxyEvent } from 'aws-lambda';

jest.mock('../services/dynamodb');

describe('Property 2: Room creation persistence', () => {
  const validRoomArbitrary = fc.record({
    roomNumber: fc.integer({ min: 1, max: 9999 }),
    floorNumber: fc.integer({ min: 1, max: 100 }),
    hasView: fc.boolean(),
  });

  it('should persist any valid room and make it retrievable', async () => {
    await fc.assert(
      fc.asyncProperty(validRoomArbitrary, async (newRoomData) => {
        const expectedRoom: Room = {
          id: newRoomData.roomNumber,
          floor: newRoomData.floorNumber,
          hasView: newRoomData.hasView,
        };

        // Mock addRoom to simulate successful storage
        (dynamoDBService.addRoom as jest.Mock).mockResolvedValue(expectedRoom);

        // Simulate that after adding, the room is in the database
        const existingRooms: Room[] = [expectedRoom];
        (dynamoDBService.getAllRooms as jest.Mock).mockResolvedValue(existingRooms);

        // Add the room
        const addEvent = {
          body: JSON.stringify(newRoomData),
        } as APIGatewayProxyEvent;

        const addResult = await addRoomHandler(addEvent);
        expect(addResult.statusCode).toBe(201);

        const addBody = JSON.parse(addResult.body);
        expect(addBody.room).toEqual(expectedRoom);

        // Verify it's retrievable
        const getRoomsEvent = {} as APIGatewayProxyEvent;
        const getRoomsResult = await getRoomsHandler(getRoomsEvent);
        
        expect(getRoomsResult.statusCode).toBe(200);
        const getRoomsBody = JSON.parse(getRoomsResult.body);
        
        // The added room should be in the list
        expect(getRoomsBody.rooms).toContainEqual(expectedRoom);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: serverless-migration, Property 3: Invalid room rejection
 * Validates: Requirements 2.2
 * 
 * For any invalid room data (missing required fields, invalid types, or negative numbers),
 * when POST /api/rooms is called, the API should return a 400 status code
 * and not create the room in DynamoDB.
 */

describe('Property 3: Invalid room rejection', () => {
  const invalidRoomArbitrary = fc.oneof(
    // Missing roomNumber
    fc.record({
      floorNumber: fc.integer({ min: 1, max: 100 }),
      hasView: fc.boolean(),
    }),
    // Missing floorNumber
    fc.record({
      roomNumber: fc.integer({ min: 1, max: 9999 }),
      hasView: fc.boolean(),
    }),
    // Missing hasView
    fc.record({
      roomNumber: fc.integer({ min: 1, max: 9999 }),
      floorNumber: fc.integer({ min: 1, max: 100 }),
    }),
    // Negative roomNumber
    fc.record({
      roomNumber: fc.integer({ max: 0 }),
      floorNumber: fc.integer({ min: 1, max: 100 }),
      hasView: fc.boolean(),
    }),
    // Negative floorNumber
    fc.record({
      roomNumber: fc.integer({ min: 1, max: 9999 }),
      floorNumber: fc.integer({ max: 0 }),
      hasView: fc.boolean(),
    }),
    // Non-integer roomNumber
    fc.record({
      roomNumber: fc.double({ min: 0.1, max: 9999.9, noNaN: true }),
      floorNumber: fc.integer({ min: 1, max: 100 }),
      hasView: fc.boolean(),
    }),
    // Non-integer floorNumber
    fc.record({
      roomNumber: fc.integer({ min: 1, max: 9999 }),
      floorNumber: fc.double({ min: 0.1, max: 100.9, noNaN: true }),
      hasView: fc.boolean(),
    }),
    // Invalid hasView type (string)
    fc.record({
      roomNumber: fc.integer({ min: 1, max: 9999 }),
      floorNumber: fc.integer({ min: 1, max: 100 }),
      hasView: fc.constantFrom('true', 'false', 'yes', 'no'),
    }),
    // Invalid hasView type (number)
    fc.record({
      roomNumber: fc.integer({ min: 1, max: 9999 }),
      floorNumber: fc.integer({ min: 1, max: 100 }),
      hasView: fc.constantFrom(0, 1),
    })
  );

  it('should reject any invalid room data with 400 status', async () => {
    await fc.assert(
      fc.asyncProperty(invalidRoomArbitrary, async (invalidData) => {
        // Mock should not be called for invalid data
        (dynamoDBService.addRoom as jest.Mock).mockClear();

        const event = {
          body: JSON.stringify(invalidData),
        } as APIGatewayProxyEvent;

        const result = await addRoomHandler(event);

        // Should return 400 status code
        expect(result.statusCode).toBe(400);

        // Should not call DynamoDB
        expect(dynamoDBService.addRoom).not.toHaveBeenCalled();

        // Response should contain error message
        const body = JSON.parse(result.body);
        expect(body).toHaveProperty('error');
      }),
      { numRuns: 100 }
    );
  });
});
