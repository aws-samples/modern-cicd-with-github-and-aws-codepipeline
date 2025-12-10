export type RoomStatus = 'available' | 'occupied' | 'maintenance';

export interface Room {
  id: number;
  floor: number;
  hasView: boolean;
  status: RoomStatus;
  capacity: number;
}

export interface NewRoom {
  roomNumber: number;
  floorNumber: number;
  hasView: boolean;
  status?: RoomStatus;
  capacity?: number;
}

export interface UpdateRoom {
  floor?: number;
  hasView?: boolean;
  status?: RoomStatus;
  capacity?: number;
}

export interface AppConfig {
  hotelName: string;
}
