import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TilFilters } from './TilFilters';

describe('TilFilters', () => {
  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render search input', () => {
    render(<TilFilters onFilterChange={mockOnFilterChange} />);
    expect(screen.getByPlaceholderText('Search TILs...')).toBeInTheDocument();
  });

  it('should render sort buttons', () => {
    render(<TilFilters onFilterChange={mockOnFilterChange} />);
    expect(screen.getByText('Trending')).toBeInTheDocument();
    expect(screen.getByText('Newest')).toBeInTheDocument();
    expect(screen.getByText('Top')).toBeInTheDocument();
  });

  it('should render tag dropdown when tags provided', () => {
    render(<TilFilters onFilterChange={mockOnFilterChange} popularTags={['react', 'rust']} />);
    const select = screen.getByLabelText('Tag filter');
    expect(select).toBeInTheDocument();
  });

  it('should debounce search input', () => {
    render(<TilFilters onFilterChange={mockOnFilterChange} />);
    const input = screen.getByPlaceholderText('Search TILs...');
    fireEvent.change(input, { target: { value: 'hooks' } });

    expect(mockOnFilterChange).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'hooks' })
    );
  });

  it('should call onFilterChange when sort changes', () => {
    render(<TilFilters onFilterChange={mockOnFilterChange} />);
    fireEvent.click(screen.getByText('Newest'));

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'newest' })
    );
  });
});
