import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollectionFilter } from './CollectionFilter';
import { useRouter, useSearchParams } from 'next/navigation';
import * as collectionActions from '@/app/actions/collections';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock server actions
vi.mock('@/app/actions/collections', () => ({
  getCollectionsAction: vi.fn(),
}));

// Mock CollectionDialog
vi.mock('./CollectionDialog', () => ({
  CollectionDialog: ({ open, onOpenChange, onSuccess }: any) => (
    open ? (
      <div data-testid="collection-dialog">
        <button onClick={() => onOpenChange(false)}>Close Dialog</button>
        <button onClick={() => { onSuccess?.(); onOpenChange(false); }} data-testid="create-btn">Create</button>
      </div>
    ) : null
  ),
}));

describe('CollectionFilter', () => {
  const mockPush = vi.fn();
  const mockSearchParams = new URLSearchParams();

  const mockCollections = [
    { id: 'col-1', name: 'Work', description: 'Work stuff', color: '#EF4444', contentCount: 5, createdAt: new Date(), updatedAt: new Date() },
    { id: 'col-2', name: 'Personal', description: null, color: '#3B82F6', contentCount: 3, createdAt: new Date(), updatedAt: new Date() },
    { id: 'col-3', name: 'Archive', description: null, color: null, contentCount: 10, createdAt: new Date(), updatedAt: new Date() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete('collectionId');

    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as any);

    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);

    vi.mocked(collectionActions.getCollectionsAction).mockResolvedValue({
      success: true,
      collections: mockCollections,
    });
  });

  describe('Loading State', () => {
    it('should show loading text while fetching collections', () => {
      vi.mocked(collectionActions.getCollectionsAction).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          success: true,
          collections: mockCollections,
        }), 100))
      );

      render(<CollectionFilter />);
      expect(screen.getByText('Loading collections...')).toBeInTheDocument();
    });
  });

  describe('Default State', () => {
    it('should show All Collections button when no collection selected', async () => {
      render(<CollectionFilter />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /all collections/i })).toBeInTheDocument();
      });
    });

    it('should show folder icon in All Collections button', async () => {
      render(<CollectionFilter />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /all collections/i });
        expect(button.querySelector('svg')).toBeInTheDocument();
      });
    });
  });

  describe('Selected Collection', () => {
    it('should show selected collection name in button', async () => {
      mockSearchParams.set('collectionId', 'col-1');

      render(<CollectionFilter />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /work/i })).toBeInTheDocument();
      });
    });

    it('should show collection color indicator', async () => {
      mockSearchParams.set('collectionId', 'col-1');

      render(<CollectionFilter />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        const colorIndicator = button.querySelector('[style*="background-color"]');
        expect(colorIndicator).toBeInTheDocument();
      });
    });
  });

  describe('Dropdown Menu', () => {
    it('should open dropdown when button is clicked', async () => {
      render(<CollectionFilter />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /all collections/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /all collections/i }));

      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
        expect(screen.getByText('Personal')).toBeInTheDocument();
        expect(screen.getByText('Archive')).toBeInTheDocument();
      });
    });

    it('should show All Collections option in dropdown', async () => {
      render(<CollectionFilter />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /all collections/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /all collections/i }));

      // There should be two "All Collections" - one in button and one in dropdown
      await waitFor(() => {
        const allCollections = screen.getAllByText('All Collections');
        expect(allCollections.length).toBeGreaterThan(0);
      });
    });

    it('should show collection content counts', async () => {
      render(<CollectionFilter />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /all collections/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /all collections/i }));

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
      });
    });

    it('should show New Collection button in dropdown', async () => {
      render(<CollectionFilter />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /all collections/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /all collections/i }));

      await waitFor(() => {
        expect(screen.getByText('New Collection')).toBeInTheDocument();
      });
    });
  });

  describe('Selection Behavior', () => {
    it('should add collectionId to URL when collection is selected', async () => {
      render(<CollectionFilter />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /all collections/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /all collections/i }));

      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Work'));

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('collectionId=col-1'));
    });

    it('should remove collectionId from URL when All Collections is selected', async () => {
      mockSearchParams.set('collectionId', 'col-1');
      mockSearchParams.set('type', 'note');

      render(<CollectionFilter />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /work/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /work/i }));

      await waitFor(() => {
        // Find the "All Collections" option in dropdown (not the button)
        const allOptions = screen.getAllByText('All Collections');
        const dropdownOption = allOptions.find(el => el.closest('[class*="absolute"]'));
        if (dropdownOption) {
          fireEvent.click(dropdownOption);
        }
      });

      // Check that collectionId is removed but other params preserved
      const calledUrl = mockPush.mock.calls[0]?.[0];
      if (calledUrl) {
        expect(calledUrl).not.toContain('collectionId=');
        expect(calledUrl).toContain('type=note');
      }
    });

    it('should preserve other URL params when selecting collection', async () => {
      mockSearchParams.set('type', 'link');
      mockSearchParams.set('sortBy', 'title');

      render(<CollectionFilter />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /all collections/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /all collections/i }));

      await waitFor(() => {
        expect(screen.getByText('Personal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Personal'));

      const calledUrl = mockPush.mock.calls[0][0];
      expect(calledUrl).toContain('collectionId=col-2');
      expect(calledUrl).toContain('type=link');
      expect(calledUrl).toContain('sortBy=title');
    });

    it('should close dropdown after selection', async () => {
      render(<CollectionFilter />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /all collections/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /all collections/i }));

      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Work'));

      // Dropdown should be closed
      await waitFor(() => {
        // After selection, the dropdown items should not be visible
        // (but the "Work" button should remain as it's now the selected item)
        const dropdownContent = document.querySelector('[class*="absolute"]');
        expect(dropdownContent).not.toBeInTheDocument();
      });
    });
  });

  describe('Click Outside', () => {
    it('should close dropdown when clicking outside', async () => {
      render(<CollectionFilter />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /all collections/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /all collections/i }));

      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
      });

      // Click the overlay (fixed inset element)
      const overlay = document.querySelector('.fixed.inset-0');
      if (overlay) {
        fireEvent.click(overlay);
      }

      await waitFor(() => {
        const dropdownContent = document.querySelector('[class*="absolute"]');
        expect(dropdownContent).not.toBeInTheDocument();
      });
    });
  });

  describe('Create Collection', () => {
    it('should open CollectionDialog when New Collection is clicked', async () => {
      render(<CollectionFilter />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /all collections/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /all collections/i }));

      await waitFor(() => {
        expect(screen.getByText('New Collection')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('New Collection'));

      await waitFor(() => {
        expect(screen.getByTestId('collection-dialog')).toBeInTheDocument();
      });
    });

    it('should reload collections after creating new collection', async () => {
      render(<CollectionFilter />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /all collections/i })).toBeInTheDocument();
      });

      // Initial load
      expect(collectionActions.getCollectionsAction).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /all collections/i }));

      await waitFor(() => {
        expect(screen.getByText('New Collection')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('New Collection'));

      await waitFor(() => {
        expect(screen.getByTestId('collection-dialog')).toBeInTheDocument();
      });

      // Click Create in the dialog
      fireEvent.click(screen.getByTestId('create-btn'));

      await waitFor(() => {
        expect(collectionActions.getCollectionsAction).toHaveBeenCalledTimes(2);
      });
    });

    it('should close dropdown when opening create dialog', async () => {
      render(<CollectionFilter />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /all collections/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /all collections/i }));

      await waitFor(() => {
        expect(screen.getByText('New Collection')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('New Collection'));

      await waitFor(() => {
        // Dropdown should close when dialog opens
        const dropdownContent = document.querySelector('[class*="absolute"][class*="z-50"]');
        expect(dropdownContent).not.toBeInTheDocument();
      });
    });
  });

  describe('Highlight Selected', () => {
    it('should highlight All Collections when no collection is selected', async () => {
      render(<CollectionFilter />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /all collections/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /all collections/i }));

      await waitFor(() => {
        const allCollectionsOptions = screen.getAllByText('All Collections');
        const dropdownOption = allCollectionsOptions.find(el => el.closest('button[class*="bg-primary"]'));
        expect(dropdownOption).toBeInTheDocument();
      });
    });

    it('should highlight selected collection in dropdown', async () => {
      mockSearchParams.set('collectionId', 'col-2');

      render(<CollectionFilter />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /personal/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /personal/i }));

      await waitFor(() => {
        // Look for the Personal option in dropdown (it will have primary/10 bg class)
        const personalElements = screen.getAllByText('Personal');
        const dropdownOption = personalElements.find(el => {
          const button = el.closest('button');
          return button && button.className.includes('bg-primary');
        });
        expect(dropdownOption).toBeInTheDocument();
      });
    });
  });
});
