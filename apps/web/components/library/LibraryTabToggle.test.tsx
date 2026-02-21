import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LibraryTabToggle } from './LibraryTabToggle';
import { useRouter, useSearchParams } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe('LibraryTabToggle', () => {
  const mockPush = vi.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete('tab');
    mockSearchParams.delete('collectionId');
    mockSearchParams.delete('view');
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);
  });

  it('should render both tab buttons', () => {
    render(<LibraryTabToggle />);

    expect(screen.getByText('All Items')).toBeInTheDocument();
    expect(screen.getByText('Collections')).toBeInTheDocument();
  });

  it('should highlight All Items by default', () => {
    render(<LibraryTabToggle />);

    const itemsBtn = screen.getByText('All Items').closest('button')!;
    expect(itemsBtn.className).toContain('bg-primary');
    expect(itemsBtn.className).toContain('text-primary-foreground');
  });

  it('should highlight Collections when tab=collections', () => {
    mockSearchParams.set('tab', 'collections');

    render(<LibraryTabToggle />);

    const collectionsBtn = screen.getByText('Collections').closest('button')!;
    expect(collectionsBtn.className).toContain('bg-primary');

    const itemsBtn = screen.getByText('All Items').closest('button')!;
    expect(itemsBtn.className).toContain('bg-secondary');
  });

  it('should navigate to collections tab on click', () => {
    render(<LibraryTabToggle />);

    fireEvent.click(screen.getByText('Collections'));

    expect(mockPush).toHaveBeenCalledWith('/dashboard/library?tab=collections');
  });

  it('should remove tab param when switching to items (default)', () => {
    mockSearchParams.set('tab', 'collections');

    render(<LibraryTabToggle />);

    fireEvent.click(screen.getByText('All Items'));

    expect(mockPush).toHaveBeenCalledWith('/dashboard/library');
  });

  it('should clear collectionId when switching to collections tab', () => {
    mockSearchParams.set('collectionId', 'some-id');

    render(<LibraryTabToggle />);

    fireEvent.click(screen.getByText('Collections'));

    const url = mockPush.mock.calls[0][0];
    expect(url).toContain('tab=collections');
    expect(url).not.toContain('collectionId');
  });

  it('should preserve other URL params when switching tabs', () => {
    mockSearchParams.set('view', 'list');

    render(<LibraryTabToggle />);

    fireEvent.click(screen.getByText('Collections'));

    const url = mockPush.mock.calls[0][0];
    expect(url).toContain('tab=collections');
    expect(url).toContain('view=list');
  });

  it('should have aria-pressed attributes', () => {
    render(<LibraryTabToggle />);

    const itemsBtn = screen.getByText('All Items').closest('button')!;
    const collectionsBtn = screen.getByText('Collections').closest('button')!;

    expect(itemsBtn).toHaveAttribute('aria-pressed', 'true');
    expect(collectionsBtn).toHaveAttribute('aria-pressed', 'false');
  });
});
