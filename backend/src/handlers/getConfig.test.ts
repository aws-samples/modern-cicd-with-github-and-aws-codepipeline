import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from './getConfig';

describe('getConfig handler', () => {
  const mockEvent = {} as APIGatewayProxyEvent;

  it('should return hotel configuration with default name', async () => {
    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(200);
    expect(result.headers).toHaveProperty('Access-Control-Allow-Origin');
    
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('hotelName');
    expect(typeof body.hotelName).toBe('string');
  });

  it('should return hotel configuration from environment variable', async () => {
    const originalHotelName = process.env.HOTEL_NAME;
    process.env.HOTEL_NAME = 'Test Hotel';

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.hotelName).toBe('Test Hotel');

    // Restore original value
    if (originalHotelName) {
      process.env.HOTEL_NAME = originalHotelName;
    } else {
      delete process.env.HOTEL_NAME;
    }
  });

  it('should include CORS headers', async () => {
    const result = await handler(mockEvent);

    expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    expect(result.headers).toHaveProperty('Content-Type', 'application/json');
  });
});
