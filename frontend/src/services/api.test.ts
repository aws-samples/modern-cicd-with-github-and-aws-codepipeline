import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiError } from './api';

// Mock fetch globally
global.fetch = vi.fn();

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should fetch and return config', async () => {
      const mockConfig = { hotelName: 'Test Hotel' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      });

      const result = await apiClient.getConfig();

      expect(result).toEqual(mockConfig);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/config'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('getRooms', () => {
    it('should fetch and return rooms', async () => {
      const mockRooms = [
        { id: 101, floor: 1, hasView: true },
        { id: 102, floor: 1, hasView: false },
      ];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rooms: mockRooms }),
      });

      const result = await apiClient.getRooms();

      expect(result).toEqual(mockRooms);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/rooms'),
        expect.any(Object)
      );
    });
  });

  describe('addRoom', () => {
    it('should post new room and return created room', async () => {
      const newRoom = { roomNumber: 101, floorNumber: 1, hasView: true };
      const createdRoom = { id: 101, floor: 1, hasView: true };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ room: createdRoom }),
      });

      const result = await apiClient.addRoom(newRoom);

      expect(result).toEqual(createdRoom);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/rooms'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newRoom),
        })
      );
    });
  });

  describe('deleteRoom', () => {
    it('should delete a room successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Room deleted successfully', id: 101 }),
      });

      await apiClient.deleteRoom(101);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/rooms/101'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle delete errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Room not found' }),
      });

      try {
        await apiClient.deleteRoom(999);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(404);
      }
    });
  });

  describe('error handling', () => {
    it('should handle network failures after retries', async () => {
      // Mock fetch to reject with a network error after all retries
      (global.fetch as any).mockRejectedValue(new TypeError('Network error'));

      await expect(apiClient.getConfig()).rejects.toThrow(TypeError);
      // Should retry 3 times + initial attempt = 4 calls
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it('should retry on network failures and succeed', async () => {
      // First two calls fail, third succeeds
      (global.fetch as any)
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hotelName: 'Test Hotel' }),
        });

      const result = await apiClient.getConfig();

      expect(result).toEqual({ hotelName: 'Test Hotel' });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle 400 Bad Request errors with JSON response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid data', details: { field: 'roomNumber' } }),
      });

      try {
        await apiClient.getRooms();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe('Invalid data');
        expect((error as ApiError).statusCode).toBe(400);
        expect((error as ApiError).details).toEqual({ error: 'Invalid data', details: { field: 'roomNumber' } });
      }
    });

    it('should handle 404 Not Found errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Resource not found' }),
      });

      try {
        await apiClient.getRooms();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(404);
      }
    });

    it('should handle 500 Internal Server Error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Not JSON');
        },
      });

      try {
        await apiClient.getRooms();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe('HTTP 500: Internal Server Error');
        expect((error as ApiError).statusCode).toBe(500);
      }
    });

    it('should handle API errors with message field', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Validation failed' }),
      });

      try {
        await apiClient.addRoom({ roomNumber: 101, floorNumber: 1, hasView: true });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe('Validation failed');
      }
    });

    it('should handle invalid JSON responses from successful requests', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      try {
        await apiClient.getConfig();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe('Invalid JSON response from server');
      }
    });

    it('should not retry on non-network errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid data' }),
      });

      try {
        await apiClient.getRooms();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
      }

      // Should only be called once (no retries for API errors)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
