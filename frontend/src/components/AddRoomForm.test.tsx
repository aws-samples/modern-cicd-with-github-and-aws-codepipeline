import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddRoomForm } from './AddRoomForm';

describe('AddRoomForm', () => {
  it('should validate and submit form with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AddRoomForm onSubmit={onSubmit} />);

    // Fill in the form
    const roomNumberInput = screen.getByPlaceholderText('e.g., 101');
    const floorNumberInput = screen.getByPlaceholderText('e.g., 1');
    const hasViewCheckbox = screen.getByRole('checkbox', { name: /has view/i });
    const submitButton = screen.getByRole('button', { name: /add room/i });

    await user.type(roomNumberInput, '101');
    await user.type(floorNumberInput, '1');
    await user.click(hasViewCheckbox);
    await user.click(submitButton);

    // Wait for submission
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        roomNumber: 101,
        floorNumber: 1,
        hasView: true,
        status: 'available',
        capacity: 2,
      });
    });
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<AddRoomForm onSubmit={onSubmit} />);

    const submitButton = screen.getByRole('button', { name: /add room/i });
    await user.click(submitButton);

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText('Room number is required')).toBeInTheDocument();
      expect(screen.getByText('Floor number is required')).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should show validation errors for invalid numbers', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<AddRoomForm onSubmit={onSubmit} />);

    const roomNumberInput = screen.getByPlaceholderText('e.g., 101');
    const floorNumberInput = screen.getByPlaceholderText('e.g., 1');
    const submitButton = screen.getByRole('button', { name: /add room/i });

    await user.type(roomNumberInput, '-1');
    await user.type(floorNumberInput, '0');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Room number must be a positive number')).toBeInTheDocument();
      expect(screen.getByText('Floor number must be a positive number')).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should display error message when submission fails', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('Network error'));

    render(<AddRoomForm onSubmit={onSubmit} />);

    const roomNumberInput = screen.getByPlaceholderText('e.g., 101');
    const floorNumberInput = screen.getByPlaceholderText('e.g., 1');
    const submitButton = screen.getByRole('button', { name: /add room/i });

    await user.type(roomNumberInput, '101');
    await user.type(floorNumberInput, '1');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
