import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
  it('should render hotel name', () => {
    const hotelName = 'Test Hotel';
    render(<AppHeader hotelName={hotelName} />);
    
    expect(screen.getByText(hotelName)).toBeInTheDocument();
  });

  it('should render description', () => {
    render(<AppHeader hotelName="Test Hotel" />);
    
    expect(screen.getByText('Manage your hotel rooms')).toBeInTheDocument();
  });
});
