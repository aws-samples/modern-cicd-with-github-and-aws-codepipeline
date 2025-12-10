import { useState } from 'react';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Header from '@cloudscape-design/components/header';
import Button from '@cloudscape-design/components/button';
import Badge from '@cloudscape-design/components/badge';
import ButtonDropdown from '@cloudscape-design/components/button-dropdown';
import TextFilter from '@cloudscape-design/components/text-filter';
import { Room, UpdateRoom } from '../types/room';
import { EditRoomModal } from './EditRoomModal';

interface RoomListProps {
  rooms: Room[];
  loading?: boolean;
  onDelete?: (id: number) => Promise<void>;
  onUpdate?: (id: number, updates: UpdateRoom) => Promise<void>;
}

export const RoomList: React.FC<RoomListProps> = ({
  rooms,
  loading = false,
  onDelete,
  onUpdate,
}) => {
  const [sortingColumn, setSortingColumn] = useState<{ sortingField: string } | undefined>();
  const [isDescending, setIsDescending] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleDelete = async (id: number) => {
    if (!onDelete) return;
    
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdate = async (id: number, updates: UpdateRoom) => {
    if (!onUpdate) return;
    await onUpdate(id, updates);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge color="green">Available</Badge>;
      case 'occupied':
        return <Badge color="red">Occupied</Badge>;
      case 'maintenance':
        return <Badge color="blue">Maintenance</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Filter rooms
  const filteredRooms = rooms.filter((room) => {
    // Text filter (search by room number or floor)
    const matchesText = filterText === '' || 
      room.id.toString().includes(filterText) ||
      room.floor.toString().includes(filterText);

    // Status filter
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;

    return matchesText && matchesStatus;
  });

  // Sort rooms
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    if (!sortingColumn) return 0;

    const field = sortingColumn.sortingField as keyof Room;
    const aValue = a[field];
    const bValue = b[field];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return isDescending ? bValue - aValue : aValue - bValue;
    }

    if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      return isDescending
        ? (bValue ? 1 : 0) - (aValue ? 1 : 0)
        : (aValue ? 1 : 0) - (bValue ? 1 : 0);
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return isDescending
        ? bValue.localeCompare(aValue)
        : aValue.localeCompare(bValue);
    }

    return 0;
  });

  return (
    <>
      <Table
        columnDefinitions={[
          {
            id: 'id',
            header: 'Room Number',
            cell: (room) => room.id,
            sortingField: 'id',
          },
          {
            id: 'floor',
            header: 'Floor',
            cell: (room) => room.floor,
            sortingField: 'floor',
          },
          {
            id: 'capacity',
            header: 'Capacity',
            cell: (room) => `${room.capacity} guests`,
            sortingField: 'capacity',
          },
          {
            id: 'hasView',
            header: 'Has View',
            cell: (room) =>
              room.hasView ? (
                <Badge color="green">Yes</Badge>
              ) : (
                <Badge color="red">No</Badge>
              ),
            sortingField: 'hasView',
          },
          {
            id: 'status',
            header: 'Status',
            cell: (room) => getStatusBadge(room.status),
            sortingField: 'status',
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (room) => (
              <SpaceBetween direction="horizontal" size="xs">
                {onUpdate && (
                  <Button
                    variant="normal"
                    iconName="edit"
                    onClick={() => setEditingRoom(room)}
                  >
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="normal"
                    iconName="remove"
                    loading={deletingId === room.id}
                    disabled={deletingId !== null}
                    onClick={() => handleDelete(room.id)}
                  >
                    Delete
                  </Button>
                )}
              </SpaceBetween>
            ),
          },
        ]}
        items={sortedRooms}
        loading={loading}
        loadingText="Loading rooms"
        sortingColumn={sortingColumn}
        sortingDescending={isDescending}
        onSortingChange={(event) => {
          setSortingColumn(event.detail.sortingColumn);
          setIsDescending(event.detail.isDescending || false);
        }}
        filter={
          <SpaceBetween size="m" direction="horizontal">
            <div style={{ minWidth: '300px', flexGrow: 1 }}>
              <TextFilter
                filteringText={filterText}
                filteringPlaceholder="Search by room number or floor"
                filteringAriaLabel="Filter rooms"
                onChange={({ detail }) => setFilterText(detail.filteringText)}
              />
            </div>
            <ButtonDropdown
              items={[
                { id: 'all', text: 'All Statuses' },
                { id: 'available', text: 'Available' },
                { id: 'occupied', text: 'Occupied' },
                { id: 'maintenance', text: 'Maintenance' },
              ]}
              onItemClick={({ detail }) => setStatusFilter(detail.id)}
            >
              Filter by Status: {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
            </ButtonDropdown>
          </SpaceBetween>
        }
        empty={
          <Box textAlign="center" color="inherit">
            <SpaceBetween size="m">
              <b>No rooms</b>
              <span>No rooms to display.</span>
            </SpaceBetween>
          </Box>
        }
        header={
          <Header counter={`(${sortedRooms.length})`}>
            Rooms
          </Header>
        }
      />
      <EditRoomModal
        room={editingRoom}
        visible={editingRoom !== null}
        onDismiss={() => setEditingRoom(null)}
        onSave={handleUpdate}
      />
    </>
  );
};
