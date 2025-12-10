import { useState, useEffect } from 'react';
import Modal from '@cloudscape-design/components/modal';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Checkbox from '@cloudscape-design/components/checkbox';
import Select from '@cloudscape-design/components/select';
import { Room, UpdateRoom } from '../types/room';

interface EditRoomModalProps {
  room: Room | null;
  visible: boolean;
  onDismiss: () => void;
  onSave: (id: number, updates: UpdateRoom) => Promise<void>;
}

export const EditRoomModal: React.FC<EditRoomModalProps> = ({
  room,
  visible,
  onDismiss,
  onSave,
}) => {
  const [floor, setFloor] = useState('');
  const [hasView, setHasView] = useState(false);
  const [status, setStatus] = useState<'available' | 'occupied' | 'maintenance'>('available');
  const [capacity, setCapacity] = useState('');
  const [loading, setLoading] = useState(false);

  const [floorError, setFloorError] = useState('');
  const [capacityError, setCapacityError] = useState('');

  useEffect(() => {
    if (room) {
      setFloor(room.floor.toString());
      setHasView(room.hasView);
      setStatus(room.status);
      setCapacity(room.capacity.toString());
    }
  }, [room]);

  const validateForm = (): boolean => {
    let isValid = true;

    if (!floor.trim()) {
      setFloorError('Floor number is required');
      isValid = false;
    } else if (isNaN(Number(floor)) || Number(floor) <= 0) {
      setFloorError('Floor number must be a positive number');
      isValid = false;
    } else {
      setFloorError('');
    }

    if (!capacity.trim()) {
      setCapacityError('Capacity is required');
      isValid = false;
    } else if (isNaN(Number(capacity)) || Number(capacity) < 1 || Number(capacity) > 10) {
      setCapacityError('Capacity must be between 1 and 10');
      isValid = false;
    } else {
      setCapacityError('');
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!room || !validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(room.id, {
        floor: Number(floor),
        hasView,
        status,
        capacity: Number(capacity),
      });
      onDismiss();
    } catch (error) {
      console.error('Error updating room:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!room) return null;

  return (
    <Modal
      onDismiss={onDismiss}
      visible={visible}
      header={`Edit Room ${room.id}`}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={loading}>
              Save
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="l">
        <FormField
          label="Floor Number"
          errorText={floorError}
          description="Enter the floor number"
        >
          <Input
            value={floor}
            onChange={(event) => setFloor(event.detail.value)}
            type="number"
            disabled={loading}
          />
        </FormField>
        <FormField description="Does this room have a view?">
          <Checkbox
            checked={hasView}
            onChange={(event) => setHasView(event.detail.checked)}
            disabled={loading}
          >
            Has View
          </Checkbox>
        </FormField>
        <FormField label="Status" description="Current room status">
          <Select
            selectedOption={{ label: status.charAt(0).toUpperCase() + status.slice(1), value: status }}
            onChange={(event) => setStatus(event.detail.selectedOption.value as 'available' | 'occupied' | 'maintenance')}
            options={[
              { label: 'Available', value: 'available' },
              { label: 'Occupied', value: 'occupied' },
              { label: 'Maintenance', value: 'maintenance' },
            ]}
            disabled={loading}
          />
        </FormField>
        <FormField
          label="Capacity"
          errorText={capacityError}
          description="Number of guests (1-10)"
        >
          <Input
            value={capacity}
            onChange={(event) => setCapacity(event.detail.value)}
            type="number"
            disabled={loading}
          />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
};
