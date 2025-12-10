import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { dynamoDBService } from '../services/dynamodb';
import { successResponse, errorResponse } from '../utils/response';
import { validateNewRoom } from '../utils/validation';
import { NewRoom, Room } from '../types/room';

/**
 * Lambda handler for POST /api/rooms
 * Creates a new room in DynamoDB
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
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
    const validationErrors = validateNewRoom(requestData);
    if (validationErrors.length > 0) {
      return errorResponse(400, 'Validation failed', validationErrors);
    }

    // Create room object
    const newRoomData = requestData as NewRoom;
    const room: Room = {
      id: newRoomData.roomNumber,
      floor: newRoomData.floorNumber,
      hasView: newRoomData.hasView,
      status: newRoomData.status || 'available',
      capacity: newRoomData.capacity || 2,
    };

    // Add to DynamoDB
    const createdRoom = await dynamoDBService.addRoom(room);

    return successResponse(201, {
      room: createdRoom,
    });
  } catch (error) {
    console.error('Error in addRoom handler:', error);
    return errorResponse(500, 'Failed to add room');
  }
};
