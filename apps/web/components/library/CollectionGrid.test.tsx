import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CollectionGrid } from './CollectionGrid';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCollectionsAction, deleteCollectionAction } from '@/app/actions/collections';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('@/app/actions/collections', () => ({
  getCollectionsAction: vi.fn(),
  deleteCollectionAction: vi.fn(),
}));

vi.mock('./CollectionDialog', () => ({
  CollectionDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="collection-dialog">Collection Dialog</div> : null,
}));

vi.mock('./ShareCollectionDialog', () => ({
  ShareCollectionDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="share-dialog">Share Dialog</div> : null,
}));

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

const mockCollections = [
  {
    id: 'col-1',
    name: 'Research',
    description: 'Research papers and articles',
    color: '#3B82F6',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    contentCount: 5,
  },
  {
    id: 'col-2',
    name: 'Projects',
    description: null,
    color: null,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    contentCount: 0,
  },
];

describe('CollectionGrid', () => {
  const mockPush = vi.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);
    vi.mocked(getCollectionsAction).mockResolvedValue({
      success: true,
      collections: mockCollections,
    });
  });

  it('should show loading skeleton initially', () => {
    // Prevent resolving immediately
    vi.mocked(getCollectionsAction).mockReturnValue(new Promise(() => {}));

    render(<CollectionGrid />);

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(3);
  });

  it('should render collection cards after loading', async () => {
    render(<CollectionGrid />);

    await waitFor(() => {
      expect(screen.getByText('Research')).toBeInTheDocument();
    });

    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('should display collection descriptions', async () => {
    render(<CollectionGrid />);

    await waitFor(() => {
      expect(screen.getByText('Research papers and articles')).toBeInTheDocument();
    });
  });

  it('should display item counts', async () => {
    render(<CollectionGrid />);

    await waitFor(() => {
      expect(screen.getByText('5 items')).toBeInTheDocument();
      expect(screen.getByText('0 items')).toBeInTheDocument();
    });
  });

  it('should display total collection count', async () => {
    render(<CollectionGrid />);

    await waitFor(() => {
      expect(screen.getByText('2 collections')).toBeInTheDocument();
    });
  });

  it('should navigate to collection filter on card click', async () => {
    render(<CollectionGrid />);

    await waitFor(() => {
      expect(screen.getByText('Research')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Research').closest('article')!);

    const url = mockPush.mock.calls[0][0];
    expect(url).toContain('collectionId=col-1');
    expect(url).not.toContain('tab=');
  });

  it('should navigate on keyboard Enter', async () => {
    render(<CollectionGrid />);

    await waitFor(() => {
      expect(screen.getByText('Research')).toBeInTheDocument();
    });

    fireEvent.keyDown(screen.getByText('Research').closest('article')!, { key: 'Enter' });

    expect(mockPush).toHaveBeenCalled();
    expect(mockPush.mock.calls[0][0]).toContain('collectionId=col-1');
  });

  it('should show empty state when no collections', async () => {
    vi.mocked(getCollectionsAction).mockResolvedValue({
      success: true,
      collections: [],
    });

    render(<CollectionGrid />);

    await waitFor(() => {
      expect(screen.getByText('No collections yet')).toBeInTheDocument();
    });

    expect(screen.getByText('Create Your First Collection')).toBeInTheDocument();
  });

  it('should show New Collection button', async () => {
    render(<CollectionGrid />);

    await waitFor(() => {
      expect(screen.getByText('New Collection')).toBeInTheDocument();
    });
  });

  it('should open dialog when clicking New Collection', async () => {
    render(<CollectionGrid />);

    await waitFor(() => {
      expect(screen.getByText('New Collection')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Collection'));

    expect(screen.getByTestId('collection-dialog')).toBeInTheDocument();
  });

  it('should have colored accent bars', async () => {
    render(<CollectionGrid />);

    await waitFor(() => {
      expect(screen.getByText('Research')).toBeInTheDocument();
    });

    const researchCard = screen.getByText('Research').closest('article')!;
    const accentBar = researchCard.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(accentBar.style.backgroundColor).toBe('rgb(59, 130, 246)');
  });

  it('should have role=button on collection cards', async () => {
    render(<CollectionGrid />);

    await waitFor(() => {
      expect(screen.getByText('Research')).toBeInTheDocument();
    });

    const cards = screen.getAllByRole('button');
    // Includes card buttons and New Collection button
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });
});
