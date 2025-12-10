import { ValidationError } from '../types/room';

export function validateRoomNumber(roomNumber: any): ValidationError | null {
  if (typeof roomNumber !== 'number') {
    return {
      field: 'roomNumber',
      message: 'Room number must be a number',
    };
  }

  if (!Number.isInteger(roomNumber)) {
    return {
      field: 'roomNumber',
      message: 'Room number must be an integer',
    };
  }

  if (roomNumber <= 0) {
    return {
      field: 'roomNumber',
      message: 'Room number must be a positive integer',
    };
  }

  return null;
}

export function validateFloorNumber(floorNumber: any): ValidationError | null {
  if (typeof floorNumber !== 'number') {
    return {
      field: 'floorNumber',
      message: 'Floor number must be a number',
    };
  }

  if (!Number.isInteger(floorNumber)) {
    return {
      field: 'floorNumber',
      message: 'Floor number must be an integer',
    };
  }

  if (floorNumber <= 0) {
    return {
      field: 'floorNumber',
      message: 'Floor number must be a positive integer',
    };
  }

  return null;
}

export function validateHasView(hasView: any): ValidationError | null {
  if (typeof hasView !== 'boolean') {
    return {
      field: 'hasView',
      message: 'hasView must be a boolean',
    };
  }

  return null;
}

export function validateStatus(status: any): ValidationError | null {
  if (status === undefined) {
    return null; // Optional field
  }

  const validStatuses = ['available', 'occupied', 'maintenance'];
  if (!validStatuses.includes(status)) {
    return {
      field: 'status',
      message: 'Status must be one of: available, occupied, maintenance',
    };
  }

  return null;
}

export function validateCapacity(capacity: any): ValidationError | null {
  if (capacity === undefined) {
    return null; // Optional field
  }

  if (typeof capacity !== 'number') {
    return {
      field: 'capacity',
      message: 'Capacity must be a number',
    };
  }

  if (!Number.isInteger(capacity)) {
    return {
      field: 'capacity',
      message: 'Capacity must be an integer',
    };
  }

  if (capacity < 1 || capacity > 10) {
    return {
      field: 'capacity',
      message: 'Capacity must be between 1 and 10',
    };
  }

  return null;
}

export function validateNewRoom(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return [{ field: 'body', message: 'Request body must be an object' }];
  }

  const roomNumberError = validateRoomNumber(data.roomNumber);
  if (roomNumberError) {
    errors.push(roomNumberError);
  }

  const floorNumberError = validateFloorNumber(data.floorNumber);
  if (floorNumberError) {
    errors.push(floorNumberError);
  }

  const hasViewError = validateHasView(data.hasView);
  if (hasViewError) {
    errors.push(hasViewError);
  }

  const statusError = validateStatus(data.status);
  if (statusError) {
    errors.push(statusError);
  }

  const capacityError = validateCapacity(data.capacity);
  if (capacityError) {
    errors.push(capacityError);
  }

  return errors;
}

export function validateUpdateRoom(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return [{ field: 'body', message: 'Request body must be an object' }];
  }

  // All fields are optional for update
  if (data.floor !== undefined) {
    const floorError = validateFloorNumber(data.floor);
    if (floorError) {
      errors.push(floorError);
    }
  }

  if (data.hasView !== undefined) {
    const hasViewError = validateHasView(data.hasView);
    if (hasViewError) {
      errors.push(hasViewError);
    }
  }

  if (data.status !== undefined) {
    const statusError = validateStatus(data.status);
    if (statusError) {
      errors.push(statusError);
    }
  }

  if (data.capacity !== undefined) {
    const capacityError = validateCapacity(data.capacity);
    if (capacityError) {
      errors.push(capacityError);
    }
  }

  // At least one field must be provided
  if (Object.keys(data).length === 0) {
    errors.push({
      field: 'body',
      message: 'At least one field must be provided for update',
    });
  }

  return errors;
}
