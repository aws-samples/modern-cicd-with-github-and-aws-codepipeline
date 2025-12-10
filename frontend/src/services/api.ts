import { Room, NewRoom, UpdateRoom, AppConfig } from '../types/room';
import config from '../config';

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retries: number = this.maxRetries
  ): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      return response;
    } catch (error) {
      if (retries > 0 && error instanceof TypeError) {
        // Network error, retry
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        errorDetails = errorData;
      } catch {
        // Response body is not JSON
      }

      throw new ApiError(errorMessage, response.status, errorDetails);
    }

    try {
      return await response.json();
    } catch (error) {
      throw new ApiError('Invalid JSON response from server');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Check /api/rooms to ensure both Lambda and DynamoDB are ready
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/api/rooms`,
        {},
        1 // Only 1 retry for health check to fail fast
      );
      
      // Accept 200 (success) or 500 with specific DynamoDB errors
      // 500 means Lambda is running but DynamoDB might not be ready yet
      if (response.ok) {
        return true;
      }
      
      // If we get a 500, check if it's a DynamoDB connection issue
      // If so, we should keep waiting
      if (response.status === 500) {
        try {
          const errorData = await response.json();
          const errorMessage = errorData.error || errorData.message || '';
          
          // These errors mean DynamoDB isn't ready yet
          if (
            errorMessage.includes('ECONNREFUSED') ||
            errorMessage.includes('ResourceNotFoundException') ||
            errorMessage.includes('non-existent table')
          ) {
            return false; // Keep waiting
          }
        } catch {
          // If we can't parse the error, assume not ready
          return false;
        }
      }
      
      return false;
    } catch {
      return false;
    }
  }

  async getConfig(): Promise<AppConfig> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/config`);
    return this.handleResponse<AppConfig>(response);
  }

  async getRooms(): Promise<Room[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/rooms`);
    const data = await this.handleResponse<{ rooms: Room[] }>(response);
    return data.rooms;
  }

  async addRoom(room: NewRoom): Promise<Room> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/rooms`, {
      method: 'POST',
      body: JSON.stringify(room),
    });
    const data = await this.handleResponse<{ room: Room }>(response);
    return data.room;
  }

  async updateRoom(id: number, updates: UpdateRoom): Promise<Room> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/api/rooms/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
    const data = await this.handleResponse<{ room: Room }>(response);
    return data.room;
  }

  async deleteRoom(id: number): Promise<void> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/api/rooms/${id}`,
      {
        method: 'DELETE',
      }
    );
    await this.handleResponse<{ message: string; id: number }>(response);
  }
}

export const apiClient = new ApiClient(config.apiUrl);
export { ApiError };
