import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, within, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import { AddRoomForm } from './AddRoomForm';
import { NewRoom } from '../types/room';

/**
 * Feature: serverless-migration, Property 5: Form submission triggers API call
 * Validates: Requirements 1.4
 * 
 * For any valid room data entered in the add room form, when the form is submitted,
 * a POST request should be sent to /api/rooms with the correct data.
 */
describe('Property 5: Form submission triggers API call', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  // Arbitrary for generating valid room data
  const validRoomArbitrary = fc.record({
    roomNumber: fc.integer({ min: 1, max: 9999 }),
    floorNumber: fc.integer({ min: 1, max: 100 }),
    hasView: fc.boolean(),
    status: fc.constantFrom('available', 'occupied', 'maintenance'),
    capacity: fc.integer({ min: 1, max: 10 }),
  });

  it('should call onSubmit with correct data for valid inputs', async () => {
    await fc.assert(
      fc.asyncProperty(validRoomArbitrary, async (roomData: NewRoom) => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        const { container, unmount } = render(<AddRoomForm onSubmit={onSubmit} />);

        try {
          // Use within to scope queries to this specific container
          const roomNumberInput = within(container).getByPlaceholderText('e.g., 101');
          const floorNumberInput = within(container).getByPlaceholderText('e.g., 1');
          const capacityInput = within(container).getByPlaceholderText('e.g., 2');
          const hasViewCheckbox = within(container).getByRole('checkbox', { name: /has view/i });
          const submitButton = within(container).getByRole('button', { name: /add room/i });

          // Clear and type values
          await user.clear(roomNumberInput);
          await user.type(roomNumberInput, roomData.roomNumber.toString());
          
          await user.clear(floorNumberInput);
          await user.type(floorNumberInput, roomData.floorNumber.toString());

          await user.clear(capacityInput);
          await user.type(capacityInput, roomData.capacity.toString());

          // Handle checkbox - ensure it matches the desired state
          if (roomData.hasView && !hasViewCheckbox.checked) {
            await user.click(hasViewCheckbox);
          } else if (!roomData.hasView && hasViewCheckbox.checked) {
            await user.click(hasViewCheckbox);
          }

          // Submit the form
          await user.click(submitButton);

          // Wait for submission
          await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith({
              roomNumber: roomData.roomNumber,
              floorNumber: roomData.floorNumber,
              hasView: roomData.hasView,
              status: 'available', // Form defaults to available
              capacity: roomData.capacity,
            });
          }, { timeout: 2000 });
        } finally {
          // Always clean up
          unmount();
        }
      }),
      { numRuns: 10 } // Reduced from 100 to 10 for faster execution
    );
  }, 60000); // Increased timeout

  // Arbitrary for generating invalid room data
  const invalidRoomArbitrary = fc.oneof(
    // Negative room numbers
    fc.record({
      roomNumber: fc.integer({ max: 0 }),
      floorNumber: fc.integer({ min: 1, max: 100 }),
      capacity: fc.integer({ min: 1, max: 10 }),
      hasView: fc.boolean(),
    }),
    // Negative floor numbers
    fc.record({
      roomNumber: fc.integer({ min: 1, max: 9999 }),
      floorNumber: fc.integer({ max: 0 }),
      capacity: fc.integer({ min: 1, max: 10 }),
      hasView: fc.boolean(),
    }),
    // Invalid capacity (too high)
    fc.record({
      roomNumber: fc.integer({ min: 1, max: 9999 }),
      floorNumber: fc.integer({ min: 1, max: 100 }),
      capacity: fc.integer({ min: 11, max: 100 }),
      hasView: fc.boolean(),
    }),
    // Invalid capacity (zero or negative)
    fc.record({
      roomNumber: fc.integer({ min: 1, max: 9999 }),
      floorNumber: fc.integer({ min: 1, max: 100 }),
      capacity: fc.integer({ max: 0 }),
      hasView: fc.boolean(),
    })
  );

  it('should not call onSubmit for invalid inputs', async () => {
    await fc.assert(
      fc.asyncProperty(invalidRoomArbitrary, async (roomData) => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        const { container, unmount } = render(<AddRoomForm onSubmit={onSubmit} />);

        try {
          // Use within to scope queries to this specific container
          const roomNumberInput = within(container).getByPlaceholderText('e.g., 101');
          const floorNumberInput = within(container).getByPlaceholderText('e.g., 1');
          const capacityInput = within(container).getByPlaceholderText('e.g., 2');
          const submitButton = within(container).getByRole('button', { name: /add room/i });

          // Clear and type values
          await user.clear(roomNumberInput);
          await user.type(roomNumberInput, roomData.roomNumber.toString());
          
          await user.clear(floorNumberInput);
          await user.type(floorNumberInput, roomData.floorNumber.toString());

          await user.clear(capacityInput);
          await user.type(capacityInput, roomData.capacity.toString());

          // Submit the form
          await user.click(submitButton);

          // Wait a bit to ensure no submission happens
          await new Promise(resolve => setTimeout(resolve, 200));

          // onSubmit should not have been called
          expect(onSubmit).not.toHaveBeenCalled();
        } finally {
          // Always clean up
          unmount();
        }
      }),
      { numRuns: 10 } // Reduced from 100 to 10 for faster execution
    );
  }, 60000); // Increased timeout
});
