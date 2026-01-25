import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SelectionToggle } from './SelectionToggle';
import { BulkSelectionProvider } from './BulkSelectionContext';

// Wrapper component to provide context
function renderWithProvider(ui: React.ReactElement) {
  return render(
    <BulkSelectionProvider>
      {ui}
    </BulkSelectionProvider>
  );
}

describe('SelectionToggle', () => {
  const allIds = ['id1', 'id2', 'id3'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('When NOT in selection mode', () => {
    it('should render Select button', () => {
      renderWithProvider(<SelectionToggle allIds={allIds} />);
      expect(screen.getByRole('button', { name: /select/i })).toBeInTheDocument();
    });

    it('should show CheckSquare icon in Select button', () => {
      renderWithProvider(<SelectionToggle allIds={allIds} />);
      const button = screen.getByRole('button', { name: /select/i });
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should enter selection mode when Select button is clicked', () => {
      renderWithProvider(<SelectionToggle allIds={allIds} />);
      const button = screen.getByRole('button', { name: /select/i });

      fireEvent.click(button);

      // After entering selection mode, should show different UI
      expect(screen.getByText(/selection mode active/i)).toBeInTheDocument();
    });
  });

  describe('When in selection mode', () => {
    it('should show Selection mode active text', () => {
      renderWithProvider(<SelectionToggle allIds={allIds} />);

      // Enter selection mode first
      fireEvent.click(screen.getByRole('button', { name: /select/i }));

      expect(screen.getByText(/selection mode active/i)).toBeInTheDocument();
    });

    it('should show Select All button when no items are selected', () => {
      renderWithProvider(<SelectionToggle allIds={allIds} />);

      fireEvent.click(screen.getByRole('button', { name: /select/i }));

      expect(screen.getByRole('button', { name: /select all/i })).toBeInTheDocument();
    });

    it('should select all items when Select All is clicked', async () => {
      renderWithProvider(<SelectionToggle allIds={allIds} />);

      // Enter selection mode
      fireEvent.click(screen.getByRole('button', { name: /select/i }));

      // Click Select All
      fireEvent.click(screen.getByRole('button', { name: /select all/i }));

      // Should now show Deselect All
      expect(screen.getByRole('button', { name: /deselect all/i })).toBeInTheDocument();
    });

    it('should deselect all items when Deselect All is clicked', () => {
      renderWithProvider(<SelectionToggle allIds={allIds} />);

      // Enter selection mode and select all
      fireEvent.click(screen.getByRole('button', { name: /select/i }));
      fireEvent.click(screen.getByRole('button', { name: /select all/i }));

      // Now deselect all
      fireEvent.click(screen.getByRole('button', { name: /deselect all/i }));

      // Should now show Select All again
      expect(screen.getByRole('button', { name: /select all/i })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty allIds array', () => {
      renderWithProvider(<SelectionToggle allIds={[]} />);
      expect(screen.getByRole('button', { name: /select/i })).toBeInTheDocument();
    });

    it('should handle single item in allIds', () => {
      renderWithProvider(<SelectionToggle allIds={['single-id']} />);

      fireEvent.click(screen.getByRole('button', { name: /select/i }));
      fireEvent.click(screen.getByRole('button', { name: /select all/i }));

      expect(screen.getByRole('button', { name: /deselect all/i })).toBeInTheDocument();
    });
  });
});
