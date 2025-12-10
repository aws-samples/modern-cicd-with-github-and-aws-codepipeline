import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handler as getConfigHandler } from './getConfig';
import { handler as getRoomsHandler } from './getRooms';
import { handler as addRoomHandler } from './addRoom';
import { handler as updateRoomHandler } from './updateRoom';
import { handler as deleteRoomHandler } from './deleteRoom';
import { handler as debugHandler } from './debug';
import { errorResponse } from '../utils/response';

/**
 * Main router Lambda handler
 * Routes requests to appropriate handlers based on HTTP method and path
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const method = event.httpMethod;
  const path = event.path;

  console.log(`Router: ${method} ${path}`);

  try {
    // Route based on method and path
    if (path === '/api/config' && method === 'GET') {
      return await getConfigHandler(event);
    }

    if (path === '/api/debug' && method === 'GET') {
      return await debugHandler(event);
    }

    if (path === '/api/rooms' && method === 'GET') {
      return await getRoomsHandler(event);
    }

    if (path === '/api/rooms' && method === 'POST') {
      return await addRoomHandler(event);
    }

    // Handle PUT /api/rooms/{id}
    if (path.startsWith('/api/rooms/') && method === 'PUT') {
      // Extract room ID from path and add to pathParameters
      const id = path.split('/').pop();
      const eventWithParams = {
        ...event,
        pathParameters: { id: id || '' },
      };
      return await updateRoomHandler(eventWithParams);
    }

    // Handle DELETE /api/rooms/{id}
    if (path.startsWith('/api/rooms/') && method === 'DELETE') {
      // Extract room ID from path and add to pathParameters
      const id = path.split('/').pop();
      const eventWithParams = {
        ...event,
        pathParameters: { id: id || '' },
      };
      return await deleteRoomHandler(eventWithParams);
    }

    // No matching route
    return errorResponse(404, `Route not found: ${method} ${path}`);
  } catch (error) {
    console.error('Router error:', error);
    return errorResponse(500, 'Internal server error');
  }
};
