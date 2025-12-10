/**
 * Feature: serverless-migration, Property 8: Hotel name consistency
 * Validates: Requirements 9.5
 * 
 * For any configured hotel name value, it should appear in both the frontend UI
 * and be returned by the backend /api/config endpoint.
 */

import * as fc from 'fast-check';
import { handler } from './getConfig';
import { APIGatewayProxyEvent } from 'aws-lambda';

describe('Property 8: Hotel name consistency', () => {
  const hotelNameArbitrary = fc.oneof(
    fc.string({ minLength: 1, maxLength: 100 }),
    fc.constantFrom('Hotel California', 'Grand Hotel', 'The Plaza', 'Hilton', 'Marriott')
  );

  it('should return the configured hotel name consistently', async () => {
    await fc.assert(
      fc.asyncProperty(hotelNameArbitrary, async (hotelName) => {
        // Set the environment variable
        const originalHotelName = process.env.HOTEL_NAME;
        process.env.HOTEL_NAME = hotelName;

        const mockEvent = {} as APIGatewayProxyEvent;
        const result = await handler(mockEvent);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        
        // The returned hotel name should match the configured value
        expect(body.hotelName).toBe(hotelName);

        // Restore original value
        if (originalHotelName) {
          process.env.HOTEL_NAME = originalHotelName;
        } else {
          delete process.env.HOTEL_NAME;
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should use default hotel name when not configured', async () => {
    const originalHotelName = process.env.HOTEL_NAME;
    delete process.env.HOTEL_NAME;

    const mockEvent = {} as APIGatewayProxyEvent;
    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    // Should have a default hotel name
    expect(body.hotelName).toBeDefined();
    expect(typeof body.hotelName).toBe('string');
    expect(body.hotelName.length).toBeGreaterThan(0);

    // Restore original value
    if (originalHotelName) {
      process.env.HOTEL_NAME = originalHotelName;
    }
  });
});
