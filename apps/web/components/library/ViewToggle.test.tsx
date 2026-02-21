import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewToggle } from './ViewToggle';
import { useRouter, useSearchParams } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe('ViewToggle', () => {
  const mockPush = vi.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete('view');
    mockSearchParams.delete('type');
    mockSearchParams.delete('tab');
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);
  });

  it('should render three view buttons', () => {
    render(<ViewToggle />);

    expect(screen.getByLabelText('Grid view')).toBeInTheDocument();
    expect(screen.getByLabelText('List view')).toBeInTheDocument();
    expect(screen.getByLabelText('Board view')).toBeInTheDocument();
  });

  it('should highlight grid view by default', () => {
    render(<ViewToggle />);

    const gridBtn = screen.getByLabelText('Grid view');
    expect(gridBtn.className).toContain('bg-primary');
    expect(gridBtn.className).toContain('text-primary-foreground');
  });

  it('should highlight list view when view=list', () => {
    mockSearchParams.set('view', 'list');

    render(<ViewToggle />);

    const listBtn = screen.getByLabelText('List view');
    expect(listBtn.className).toContain('bg-primary');

    const gridBtn = screen.getByLabelText('Grid view');
    expect(gridBtn.className).toContain('bg-secondary');
  });

  it('should highlight board view when view=board', () => {
    mockSearchParams.set('view', 'board');

    render(<ViewToggle />);

    const boardBtn = screen.getByLabelText('Board view');
    expect(boardBtn.className).toContain('bg-primary');
  });

  it('should navigate to list view on click', () => {
    render(<ViewToggle />);

    fireEvent.click(screen.getByLabelText('List view'));

    expect(mockPush).toHaveBeenCalledWith('/dashboard/library?view=list');
  });

  it('should navigate to board view on click', () => {
    render(<ViewToggle />);

    fireEvent.click(screen.getByLabelText('Board view'));

    expect(mockPush).toHaveBeenCalledWith('/dashboard/library?view=board');
  });

  it('should remove view param when switching to grid (default)', () => {
    mockSearchParams.set('view', 'list');

    render(<ViewToggle />);

    fireEvent.click(screen.getByLabelText('Grid view'));

    expect(mockPush).toHaveBeenCalledWith('/dashboard/library');
  });

  it('should preserve other URL params when switching views', () => {
    mockSearchParams.set('type', 'note');
    mockSearchParams.set('tab', 'items');

    render(<ViewToggle />);

    fireEvent.click(screen.getByLabelText('List view'));

    const url = mockPush.mock.calls[0][0];
    expect(url).toContain('type=note');
    expect(url).toContain('tab=items');
    expect(url).toContain('view=list');
  });

  it('should have aria-pressed attributes', () => {
    render(<ViewToggle />);

    expect(screen.getByLabelText('Grid view')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('List view')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByLabelText('Board view')).toHaveAttribute('aria-pressed', 'false');
  });
});
