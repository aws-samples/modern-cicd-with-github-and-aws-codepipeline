import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { dynamoDBService } from '../services/dynamodb';
import { successResponse, errorResponse } from '../utils/response';

/**
 * Lambda handler for DELETE /api/rooms/{id}
 * Deletes a room from DynamoDB
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Get room ID from path parameters
    const roomId = event.pathParameters?.id;

    if (!roomId) {
      return errorResponse(400, 'Room ID is required');
    }

    // Validate room ID is a number
    const id = Number(roomId);
    if (isNaN(id) || id <= 0) {
      return errorResponse(400, 'Room ID must be a positive number');
    }

    // Delete from DynamoDB
    await dynamoDBService.deleteRoom(id);

    return successResponse(200, {
      message: 'Room deleted successfully',
      id,
    });
  } catch (error) {
    console.error('Error in deleteRoom handler:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return errorResponse(404, 'Room not found');
    }
    
    return errorResponse(500, 'Failed to delete room');
  }
};
