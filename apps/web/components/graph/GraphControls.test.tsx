import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Loader2 spinner from lucide-react
vi.mock('lucide-react', () => ({
  Loader2: (props: Record<string, unknown>) => (
    <span data-testid={props['data-testid'] as string} />
  ),
}));

import { GraphControls } from './GraphControls';

const defaultProps = {
  minSimilarity: 0.5,
  onSimilarityChange: vi.fn(),
  typeFilter: 'all',
  onTypeFilterChange: vi.fn(),
  showLabels: true,
  onShowLabelsChange: vi.fn(),
  isLoading: false,
  nodeCount: 12,
  edgeCount: 8,
  communityCount: 3,
};

describe('GraphControls', () => {
  it('renders similarity slider with correct value', () => {
    render(<GraphControls {...defaultProps} minSimilarity={0.65} />);

    const slider = screen.getByLabelText('Similarity') as HTMLInputElement;
    expect(slider).toBeInTheDocument();
    expect(slider.type).toBe('range');
    expect(slider.value).toBe('0.65');
    expect(screen.getByText('0.65')).toBeInTheDocument();
  });

  it('renders type filter buttons (all, note, link, file)', () => {
    render(<GraphControls {...defaultProps} />);

    expect(screen.getByTestId('type-filter-all')).toBeInTheDocument();
    expect(screen.getByTestId('type-filter-note')).toBeInTheDocument();
    expect(screen.getByTestId('type-filter-link')).toBeInTheDocument();
    expect(screen.getByTestId('type-filter-file')).toBeInTheDocument();
  });

  it('calls onTypeFilterChange when type button clicked', async () => {
    const onTypeFilterChange = vi.fn();
    const user = userEvent.setup();

    render(<GraphControls {...defaultProps} onTypeFilterChange={onTypeFilterChange} />);

    await user.click(screen.getByTestId('type-filter-note'));

    expect(onTypeFilterChange).toHaveBeenCalledWith('note');
  });

  it('renders labels checkbox', () => {
    render(<GraphControls {...defaultProps} showLabels={true} />);

    const checkbox = screen.getByTestId('labels-toggle') as HTMLInputElement;
    expect(checkbox).toBeInTheDocument();
    expect(checkbox.type).toBe('checkbox');
    expect(checkbox.checked).toBe(true);
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<GraphControls {...defaultProps} isLoading={true} />);

    expect(screen.getByTestId('graph-loading-spinner')).toBeInTheDocument();
  });

  it('shows node/edge count stats', () => {
    render(<GraphControls {...defaultProps} nodeCount={12} edgeCount={8} communityCount={3} />);

    expect(screen.getByText('12n / 8e / 3c')).toBeInTheDocument();
  });
});
