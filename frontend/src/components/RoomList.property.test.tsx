import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { RoomList } from './RoomList';
import { Room } from '../types/room';

/**
 * Feature: serverless-migration, Property 4: Frontend displays all rooms
 * Validates: Requirements 1.3
 * 
 * For any set of rooms returned by the API, when the rooms list page is rendered,
 * all rooms should be displayed in the UI.
 */
describe('Property 4: Frontend displays all rooms', () => {
  // Arbitrary for generating valid rooms
  const roomArbitrary = fc.record({
    id: fc.integer({ min: 1, max: 9999 }),
    floor: fc.integer({ min: 1, max: 100 }),
    hasView: fc.boolean(),
  });

  it('should display all rooms provided in props', () => {
    fc.assert(
      fc.property(
        fc.array(roomArbitrary, { minLength: 0, maxLength: 50 }),
        (rooms: Room[]) => {
          const { container, unmount } = render(<RoomList rooms={rooms} />);

          if (rooms.length === 0) {
            // Empty state should be shown
            const noRoomsElements = screen.getAllByText('No rooms');
            expect(noRoomsElements.length).toBeGreaterThan(0);
          } else {
            // All room IDs should be present in the document
            rooms.forEach((room) => {
              // Check that room ID is displayed (use getAllByText since numbers can appear in multiple columns)
              const idElements = screen.getAllByText(room.id.toString());
              expect(idElements.length).toBeGreaterThan(0);
              
              // Check that floor is displayed
              const floorElements = screen.getAllByText(room.floor.toString());
              expect(floorElements.length).toBeGreaterThan(0);
              
              // Check that view status is displayed
              const viewText = room.hasView ? 'Yes' : 'No';
              const viewElements = screen.getAllByText(viewText);
              expect(viewElements.length).toBeGreaterThan(0);
            });
          }

          // Clean up
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display correct count of rooms', () => {
    fc.assert(
      fc.property(
        fc.array(roomArbitrary, { minLength: 1, maxLength: 50 }),
        (rooms: Room[]) => {
          const { container, unmount } = render(<RoomList rooms={rooms} />);

          // Count the number of rows in the table (excluding header)
          const rows = container.querySelectorAll('tbody tr');
          expect(rows.length).toBe(rooms.length);

          // Clean up
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
