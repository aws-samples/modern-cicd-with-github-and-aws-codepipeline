import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBService } from './dynamodb';
import { Room } from '../types/room';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('DynamoDBService', () => {
  let service: DynamoDBService;

  beforeEach(() => {
    ddbMock.reset();
    service = new DynamoDBService();
  });

  describe('getAllRooms', () => {
    it('should return all rooms from DynamoDB', async () => {
      const mockRooms: Room[] = [
        { id: 101, floor: 1, hasView: true },
        { id: 102, floor: 1, hasView: false },
        { id: 201, floor: 2, hasView: true },
      ];

      ddbMock.on(ScanCommand).resolves({
        Items: mockRooms,
      });

      const result = await service.getAllRooms();

      expect(result).toEqual(mockRooms);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no rooms exist', async () => {
      ddbMock.on(ScanCommand).resolves({
        Items: [],
      });

      const result = await service.getAllRooms();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should throw error when DynamoDB scan fails', async () => {
      ddbMock.on(ScanCommand).rejects(new Error('DynamoDB error'));

      await expect(service.getAllRooms()).rejects.toThrow('Failed to retrieve rooms from database');
    });
  });

  describe('addRoom', () => {
    it('should add a room to DynamoDB', async () => {
      const newRoom: Room = { id: 301, floor: 3, hasView: true };

      ddbMock.on(PutCommand).resolves({});

      const result = await service.addRoom(newRoom);

      expect(result).toEqual(newRoom);
      expect(ddbMock.calls()).toHaveLength(1);
    });

    it('should throw error when DynamoDB put fails', async () => {
      const newRoom: Room = { id: 301, floor: 3, hasView: true };

      ddbMock.on(PutCommand).rejects(new Error('DynamoDB error'));

      await expect(service.addRoom(newRoom)).rejects.toThrow('Failed to add room to database');
    });
  });
});
