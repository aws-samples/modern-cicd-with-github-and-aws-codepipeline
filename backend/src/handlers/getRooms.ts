import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { dynamoDBService } from '../services/dynamodb';
import { successResponse, errorResponse } from '../utils/response';

/**
 * Lambda handler for GET /api/rooms
 * Returns all rooms from DynamoDB
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const rooms = await dynamoDBService.getAllRooms();

    return successResponse(200, {
      rooms,
    });
  } catch (error) {
    console.error('Error in getRooms handler:', error);
    return errorResponse(500, 'Failed to retrieve rooms');
  }
};
