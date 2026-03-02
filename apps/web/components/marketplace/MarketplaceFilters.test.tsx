import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarketplaceFilters } from './MarketplaceFilters';

describe('MarketplaceFilters', () => {
  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render search input', () => {
    render(<MarketplaceFilters onFilterChange={mockOnFilterChange} />);
    expect(screen.getByPlaceholderText('Search collections...')).toBeInTheDocument();
  });

  it('should render category dropdown', () => {
    render(<MarketplaceFilters onFilterChange={mockOnFilterChange} />);
    expect(screen.getByLabelText('Category filter')).toBeInTheDocument();
  });

  it('should render sort buttons', () => {
    render(<MarketplaceFilters onFilterChange={mockOnFilterChange} />);
    expect(screen.getByText('Trending')).toBeInTheDocument();
    expect(screen.getByText('Newest')).toBeInTheDocument();
    expect(screen.getByText('Most Cloned')).toBeInTheDocument();
  });

  it('should debounce search input', async () => {
    render(<MarketplaceFilters onFilterChange={mockOnFilterChange} />);
    const searchInput = screen.getByPlaceholderText('Search collections...');

    fireEvent.change(searchInput, { target: { value: 'react' } });

    // Should not fire immediately
    expect(mockOnFilterChange).not.toHaveBeenCalled();

    // Advance past debounce
    vi.advanceTimersByTime(300);

    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'react' })
    );
  });

  it('should call onFilterChange when category changes', () => {
    render(<MarketplaceFilters onFilterChange={mockOnFilterChange} />);
    const categorySelect = screen.getByLabelText('Category filter');

    fireEvent.change(categorySelect, { target: { value: 'programming' } });
    vi.advanceTimersByTime(300);

    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'programming' })
    );
  });

  it('should call onFilterChange when sort changes', () => {
    render(<MarketplaceFilters onFilterChange={mockOnFilterChange} />);
    const newestBtn = screen.getByText('Newest');

    fireEvent.click(newestBtn);
    vi.advanceTimersByTime(300);

    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'newest' })
    );
  });
});
