import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { dynamoDBService } from '../services/dynamodb';
import { successResponse, errorResponse } from '../utils/response';
import { validateUpdateRoom } from '../utils/validation';
import { UpdateRoom } from '../types/room';

/**
 * Lambda handler for PUT /api/rooms/{id}
 * Updates a room in DynamoDB
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

    // Parse request body
    if (!event.body) {
      return errorResponse(400, 'Request body is required');
    }

    let requestData: any;
    try {
      requestData = JSON.parse(event.body);
    } catch (error) {
      return errorResponse(400, 'Invalid JSON in request body');
    }

    // Validate input
    const validationErrors = validateUpdateRoom(requestData);
    if (validationErrors.length > 0) {
      return errorResponse(400, 'Validation failed', validationErrors);
    }

    const updateData = requestData as UpdateRoom;

    // Update in DynamoDB
    const updatedRoom = await dynamoDBService.updateRoom(id, updateData);

    return successResponse(200, {
      room: updatedRoom,
    });
  } catch (error) {
    console.error('Error in updateRoom handler:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return errorResponse(404, 'Room not found');
    }
    
    return errorResponse(500, 'Failed to update room');
  }
};
