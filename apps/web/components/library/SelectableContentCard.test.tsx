import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SelectableContentCard } from './SelectableContentCard';
import * as BulkSelectionModule from './BulkSelectionContext';

// Mock the BulkSelectionContext
vi.mock('./BulkSelectionContext', async () => {
  const actual = await vi.importActual('./BulkSelectionContext');
  return {
    ...actual,
    useBulkSelection: vi.fn(),
  };
});

// Mock the ContentCard component
vi.mock('./ContentCard', () => ({
  ContentCard: ({ title, type }: { title: string; type: string }) => (
    <div data-testid="content-card">
      <span data-testid="card-title">{title}</span>
      <span data-testid="card-type">{type}</span>
    </div>
  ),
}));

describe('SelectableContentCard', () => {
  const mockToggleSelection = vi.fn();
  const mockIsSelected = vi.fn();

  const defaultProps = {
    id: 'test-id-1',
    type: 'note' as const,
    title: 'Test Note',
    body: 'Test body',
    url: null,
    tags: ['tag1'],
    autoTags: ['auto-tag1'],
    createdAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSelected.mockReturnValue(false);
  });

  describe('When NOT in selection mode', () => {
    beforeEach(() => {
      vi.mocked(BulkSelectionModule.useBulkSelection).mockReturnValue({
        isSelectionMode: false,
        toggleSelection: mockToggleSelection,
        isSelected: mockIsSelected,
        selectedIds: new Set(),
        toggleSelectionMode: vi.fn(),
        selectAll: vi.fn(),
        deselectAll: vi.fn(),
      });
    });

    it('should render plain ContentCard', () => {
      render(<SelectableContentCard {...defaultProps} />);
      expect(screen.getByTestId('content-card')).toBeInTheDocument();
    });

    it('should pass props to ContentCard', () => {
      render(<SelectableContentCard {...defaultProps} />);
      expect(screen.getByTestId('card-title')).toHaveTextContent('Test Note');
      expect(screen.getByTestId('card-type')).toHaveTextContent('note');
    });

    it('should not render selection indicator', () => {
      render(<SelectableContentCard {...defaultProps} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('When in selection mode', () => {
    beforeEach(() => {
      vi.mocked(BulkSelectionModule.useBulkSelection).mockReturnValue({
        isSelectionMode: true,
        toggleSelection: mockToggleSelection,
        isSelected: mockIsSelected,
        selectedIds: new Set(),
        toggleSelectionMode: vi.fn(),
        selectAll: vi.fn(),
        deselectAll: vi.fn(),
      });
    });

    it('should render with role="button"', () => {
      render(<SelectableContentCard {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have tabIndex={0}', () => {
      render(<SelectableContentCard {...defaultProps} />);
      expect(screen.getByRole('button')).toHaveAttribute('tabindex', '0');
    });

    it('should toggle selection on click', () => {
      render(<SelectableContentCard {...defaultProps} />);
      const wrapper = screen.getByRole('button');

      fireEvent.click(wrapper);

      expect(mockToggleSelection).toHaveBeenCalledWith('test-id-1');
    });

    it('should toggle selection on Enter key', () => {
      render(<SelectableContentCard {...defaultProps} />);
      const wrapper = screen.getByRole('button');

      fireEvent.keyDown(wrapper, { key: 'Enter' });

      expect(mockToggleSelection).toHaveBeenCalledWith('test-id-1');
    });

    it('should toggle selection on Space key', () => {
      render(<SelectableContentCard {...defaultProps} />);
      const wrapper = screen.getByRole('button');

      fireEvent.keyDown(wrapper, { key: ' ' });

      expect(mockToggleSelection).toHaveBeenCalledWith('test-id-1');
    });

    it('should not toggle on other keys', () => {
      render(<SelectableContentCard {...defaultProps} />);
      const wrapper = screen.getByRole('button');

      fireEvent.keyDown(wrapper, { key: 'Tab' });

      expect(mockToggleSelection).not.toHaveBeenCalled();
    });

    describe('When item is NOT selected', () => {
      beforeEach(() => {
        mockIsSelected.mockReturnValue(false);
      });

      it('should show unselected indicator', () => {
        render(<SelectableContentCard {...defaultProps} />);
        const indicator = screen.getByRole('button').firstChild as HTMLElement;
        expect(indicator).toHaveClass('bg-secondary');
      });

      it('should have hover ring style', () => {
        render(<SelectableContentCard {...defaultProps} />);
        const wrapper = screen.getByRole('button');
        expect(wrapper).toHaveClass('hover:ring-2');
      });
    });

    describe('When item IS selected', () => {
      beforeEach(() => {
        mockIsSelected.mockReturnValue(true);
      });

      it('should show selected indicator with primary background', () => {
        render(<SelectableContentCard {...defaultProps} />);
        const indicator = screen.getByRole('button').firstChild as HTMLElement;
        expect(indicator).toHaveClass('bg-primary');
      });

      it('should have ring around card', () => {
        render(<SelectableContentCard {...defaultProps} />);
        const wrapper = screen.getByRole('button');
        expect(wrapper).toHaveClass('ring-2');
        expect(wrapper).toHaveClass('ring-primary');
      });

      it('should display check icon', () => {
        render(<SelectableContentCard {...defaultProps} />);
        const indicator = screen.getByRole('button').firstChild as HTMLElement;
        const svg = indicator.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });
});
