import { useEffect, useState } from 'react';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Alert from '@cloudscape-design/components/alert';
import { AppHeader } from '../components/AppHeader';
import { RoomList } from '../components/RoomList';
import { AddRoomForm } from '../components/AddRoomForm';
import { apiClient } from '../services/api';
import { Room, NewRoom, UpdateRoom } from '../types/room';
import config from '../config';

export const HomePage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hotelName, setHotelName] = useState(config.hotelName);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedRooms = await apiClient.getRooms();
      setRooms(fetchedRooms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const appConfig = await apiClient.getConfig();
      setHotelName(appConfig.hotelName);
    } catch (err) {
      console.error('Failed to fetch config:', err);
      // Use default hotel name from config
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchRooms();
  }, []);

  const handleAddRoom = async (newRoom: NewRoom) => {
    const addedRoom = await apiClient.addRoom(newRoom);
    setRooms([...rooms, addedRoom]);
  };

  const handleUpdateRoom = async (id: number, updates: UpdateRoom) => {
    const updatedRoom = await apiClient.updateRoom(id, updates);
    setRooms(rooms.map((room) => (room.id === id ? updatedRoom : room)));
  };

  const handleDeleteRoom = async (id: number) => {
    await apiClient.deleteRoom(id);
    setRooms(rooms.filter((room) => room.id !== id));
  };

  return (
    <SpaceBetween size="l">
      <AppHeader hotelName={hotelName} />
      {error && (
        <Alert
          type="error"
          dismissible
          onDismiss={() => setError(null)}
          header="Error loading rooms"
        >
          {error}
        </Alert>
      )}
      <AddRoomForm onSubmit={handleAddRoom} />
      <RoomList 
        rooms={rooms} 
        loading={loading} 
        onDelete={handleDeleteRoom}
        onUpdate={handleUpdateRoom}
      />
    </SpaceBetween>
  );
};
