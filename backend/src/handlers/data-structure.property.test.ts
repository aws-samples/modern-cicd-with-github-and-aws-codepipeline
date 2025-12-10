/**
 * Feature: serverless-migration, Property 11: Room data structure consistency
 * Validates: Requirements 11.1
 * 
 * For any room stored in DynamoDB, it should have exactly three attributes:
 * id (number), floor (number), and hasView (boolean).
 */

import * as fc from 'fast-check';
import { handler as addRoomHandler } from './addRoom';
import { handler as getRoomsHandler } from './getRooms';
import { dynamoDBService } from '../services/dynamodb';
import { Room } from '../types/room';
import { APIGatewayProxyEvent } from 'aws-lambda';

jest.mock('../services/dynamodb');

describe('Property 11: Room data structure consistency', () => {
  const validRoomArbitrary = fc.record({
    roomNumber: fc.integer({ min: 1, max: 9999 }),
    floorNumber: fc.integer({ min: 1, max: 100 }),
    hasView: fc.boolean(),
  });

  it('should ensure all rooms have exactly three attributes with correct types', async () => {
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
        expect(result.statusCode).toBe(201);

        const body = JSON.parse(result.body);
        const room = body.room;

        // Verify exactly three attributes
        expect(Object.keys(room)).toHaveLength(3);

        // Verify attribute names
        expect(room).toHaveProperty('id');
        expect(room).toHaveProperty('floor');
        expect(room).toHaveProperty('hasView');

        // Verify attribute types
        expect(typeof room.id).toBe('number');
        expect(typeof room.floor).toBe('number');
        expect(typeof room.hasView).toBe('boolean');
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: serverless-migration, Property 12: API-Database structure match
 * Validates: Requirements 11.2
 * 
 * For any room, the structure returned by the API should match the structure
 * stored in DynamoDB (id, floor, hasView with same types).
 */

describe('Property 12: API-Database structure match', () => {
  const roomArbitrary = fc.record({
    id: fc.integer({ min: 1, max: 9999 }),
    floor: fc.integer({ min: 1, max: 100 }),
    hasView: fc.boolean(),
  });

  it('should return rooms with same structure as stored in DynamoDB', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(roomArbitrary, { maxLength: 20 }), async (rooms: Room[]) => {
        (dynamoDBService.getAllRooms as jest.Mock).mockResolvedValue(rooms);

        const mockEvent = {} as APIGatewayProxyEvent;
        const result = await getRoomsHandler(mockEvent);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        const returnedRooms = body.rooms;

        // Each returned room should match the structure from DynamoDB
        returnedRooms.forEach((returnedRoom: Room, index: number) => {
          const dbRoom = rooms[index];

          // Same attributes
          expect(Object.keys(returnedRoom).sort()).toEqual(Object.keys(dbRoom).sort());

          // Same values
          expect(returnedRoom.id).toBe(dbRoom.id);
          expect(returnedRoom.floor).toBe(dbRoom.floor);
          expect(returnedRoom.hasView).toBe(dbRoom.hasView);

          // Same types
          expect(typeof returnedRoom.id).toBe(typeof dbRoom.id);
          expect(typeof returnedRoom.floor).toBe(typeof dbRoom.floor);
          expect(typeof returnedRoom.hasView).toBe(typeof dbRoom.hasView);
        });
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: serverless-migration, Property 13: Frontend-API structure match
 * Validates: Requirements 11.3
 * 
 * For any room data received from the API, the frontend should display it
 * using the same structure (id, floor, hasView).
 * 
 * Note: This test validates that the API returns data in the expected format
 * that the frontend can consume. The actual frontend display logic is tested
 * in the frontend tests.
 */

describe('Property 13: Frontend-API structure match', () => {
  const roomArbitrary = fc.record({
    id: fc.integer({ min: 1, max: 9999 }),
    floor: fc.integer({ min: 1, max: 100 }),
    hasView: fc.boolean(),
  });

  it('should return rooms in a format consumable by the frontend', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(roomArbitrary, { maxLength: 20 }), async (rooms: Room[]) => {
        (dynamoDBService.getAllRooms as jest.Mock).mockResolvedValue(rooms);

        const mockEvent = {} as APIGatewayProxyEvent;
        const result = await getRoomsHandler(mockEvent);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);

        // API should return rooms array
        expect(body).toHaveProperty('rooms');
        expect(Array.isArray(body.rooms)).toBe(true);

        // Each room should have the expected structure for frontend
        body.rooms.forEach((room: any) => {
          // Frontend expects these exact fields
          expect(room).toHaveProperty('id');
          expect(room).toHaveProperty('floor');
          expect(room).toHaveProperty('hasView');

          // Frontend expects these types
          expect(typeof room.id).toBe('number');
          expect(typeof room.floor).toBe('number');
          expect(typeof room.hasView).toBe('boolean');

          // No extra fields that frontend doesn't expect
          const expectedKeys = ['id', 'floor', 'hasView'];
          const actualKeys = Object.keys(room);
          expect(actualKeys.sort()).toEqual(expectedKeys.sort());
        });
      }),
      { numRuns: 100 }
    );
  });
});
