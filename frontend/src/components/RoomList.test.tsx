import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoomList } from './RoomList';
import { Room } from '../types/room';

describe('RoomList', () => {
  it('should display all rooms from props', () => {
    const rooms: Room[] = [
      { id: 101, floor: 1, hasView: true },
      { id: 102, floor: 1, hasView: false },
      { id: 201, floor: 2, hasView: true },
    ];

    render(<RoomList rooms={rooms} />);

    // Check that all room numbers are displayed
    expect(screen.getByText('101')).toBeInTheDocument();
    expect(screen.getByText('102')).toBeInTheDocument();
    expect(screen.getByText('201')).toBeInTheDocument();

    // Check that floor numbers are displayed
    expect(screen.getAllByText('1')).toHaveLength(2);
    expect(screen.getByText('2')).toBeInTheDocument();

    // Check that view status is displayed
    expect(screen.getAllByText('Yes')).toHaveLength(2);
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('should display empty state when no rooms', () => {
    render(<RoomList rooms={[]} />);

    expect(screen.getByText('No rooms')).toBeInTheDocument();
    expect(screen.getByText('No rooms to display.')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    render(<RoomList rooms={[]} loading={true} />);

    expect(screen.getByText('Loading rooms')).toBeInTheDocument();
  });

  it('should display delete buttons when onDelete is provided', () => {
    const rooms: Room[] = [{ id: 101, floor: 1, hasView: true }];
    const mockDelete = vi.fn();

    render(<RoomList rooms={rooms} onDelete={mockDelete} />);

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('should not display delete buttons when onDelete is not provided', () => {
    const rooms: Room[] = [{ id: 101, floor: 1, hasView: true }];

    render(<RoomList rooms={rooms} />);

    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const rooms: Room[] = [{ id: 101, floor: 1, hasView: true }];
    const mockDelete = vi.fn().mockResolvedValue(undefined);

    render(<RoomList rooms={rooms} onDelete={mockDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(mockDelete).toHaveBeenCalledWith(101);
  });

  it('should display green badge for rooms with view', () => {
    const rooms: Room[] = [{ id: 101, floor: 1, hasView: true }];

    render(<RoomList rooms={rooms} />);

    const badge = screen.getByText('Yes');
    expect(badge).toBeInTheDocument();
  });

  it('should display red badge for rooms without view', () => {
    const rooms: Room[] = [{ id: 102, floor: 1, hasView: false }];

    render(<RoomList rooms={rooms} />);

    const badge = screen.getByText('No');
    expect(badge).toBeInTheDocument();
  });
});
