import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errorResponse } from '../utils/response';

/**
 * Lambda handler for GET /api/config
 * Returns hotel configuration
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const hotelName = process.env.HOTEL_NAME || 'Hotel Yorba';

    return successResponse(200, {
      hotelName,
    });
  } catch (error) {
    console.error('Error in getConfig handler:', error);
    return errorResponse(500, 'Internal server error');
  }
};
