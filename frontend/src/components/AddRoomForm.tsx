import { useState } from 'react';
import Form from '@cloudscape-design/components/form';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Checkbox from '@cloudscape-design/components/checkbox';
import Select from '@cloudscape-design/components/select';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Flashbar, { FlashbarProps } from '@cloudscape-design/components/flashbar';
import { NewRoom } from '../types/room';

interface AddRoomFormProps {
  onSubmit: (room: NewRoom) => Promise<void>;
}

export const AddRoomForm: React.FC<AddRoomFormProps> = ({ onSubmit }) => {
  const [roomNumber, setRoomNumber] = useState('');
  const [floorNumber, setFloorNumber] = useState('');
  const [hasView, setHasView] = useState(false);
  const [status, setStatus] = useState<'available' | 'occupied' | 'maintenance'>('available');
  const [capacity, setCapacity] = useState('2');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<FlashbarProps.MessageDefinition[]>([]);

  const [roomNumberError, setRoomNumberError] = useState('');
  const [floorNumberError, setFloorNumberError] = useState('');
  const [capacityError, setCapacityError] = useState('');

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate room number
    if (!roomNumber.trim()) {
      setRoomNumberError('Room number is required');
      isValid = false;
    } else if (isNaN(Number(roomNumber)) || Number(roomNumber) <= 0) {
      setRoomNumberError('Room number must be a positive number');
      isValid = false;
    } else {
      setRoomNumberError('');
    }

    // Validate floor number
    if (!floorNumber.trim()) {
      setFloorNumberError('Floor number is required');
      isValid = false;
    } else if (isNaN(Number(floorNumber)) || Number(floorNumber) <= 0) {
      setFloorNumberError('Floor number must be a positive number');
      isValid = false;
    } else {
      setFloorNumberError('');
    }

    // Validate capacity
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessages([]);

    try {
      await onSubmit({
        roomNumber: Number(roomNumber),
        floorNumber: Number(floorNumber),
        hasView,
        status,
        capacity: Number(capacity),
      });

      setMessages([
        {
          type: 'success',
          content: 'Room added successfully',
          dismissible: true,
          onDismiss: () => setMessages([]),
        },
      ]);

      // Clear form
      setRoomNumber('');
      setFloorNumber('');
      setHasView(false);
      setStatus('available');
      setCapacity('2');
    } catch (error) {
      setMessages([
        {
          type: 'error',
          content: error instanceof Error ? error.message : 'Failed to add room',
          dismissible: true,
          onDismiss: () => setMessages([]),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container header={<Header variant="h2">Add New Room</Header>}>
      <form onSubmit={handleSubmit}>
        <Form
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="primary"
                loading={loading}
                disabled={loading}
                onClick={handleSubmit}
              >
                Add Room
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="l">
            {messages.length > 0 && <Flashbar items={messages} />}
            <FormField
              label="Room Number"
              errorText={roomNumberError}
              description="Enter the room number"
            >
              <Input
                value={roomNumber}
                onChange={(event) => setRoomNumber(event.detail.value)}
                placeholder="e.g., 101"
                type="number"
                disabled={loading}
              />
            </FormField>
            <FormField
              label="Floor Number"
              errorText={floorNumberError}
              description="Enter the floor number"
            >
              <Input
                value={floorNumber}
                onChange={(event) => setFloorNumber(event.detail.value)}
                placeholder="e.g., 1"
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
            <FormField
              label="Status"
              description="Current room status"
            >
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
                placeholder="e.g., 2"
                type="number"
                disabled={loading}
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </form>
    </Container>
  );
};
