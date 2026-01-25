import { describe, it, expect, vi } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import { BulkSelectionProvider, useBulkSelection } from './BulkSelectionContext';

describe('BulkSelectionContext', () => {
  describe('BulkSelectionProvider', () => {
    it('should render children', () => {
      render(
        <BulkSelectionProvider>
          <div data-testid="child">Child content</div>
        </BulkSelectionProvider>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should provide context to children', () => {
      function TestComponent() {
        const context = useBulkSelection();
        return <div data-testid="context">{String(context.isSelectionMode)}</div>;
      }

      render(
        <BulkSelectionProvider>
          <TestComponent />
        </BulkSelectionProvider>
      );
      expect(screen.getByTestId('context')).toHaveTextContent('false');
    });
  });

  describe('useBulkSelection hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useBulkSelection());
      }).toThrow('useBulkSelection must be used within a BulkSelectionProvider');

      consoleError.mockRestore();
    });

    describe('toggleSelectionMode', () => {
      it('should toggle isSelectionMode from false to true', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <BulkSelectionProvider>{children}</BulkSelectionProvider>
        );

        const { result } = renderHook(() => useBulkSelection(), { wrapper });

        expect(result.current.isSelectionMode).toBe(false);

        act(() => {
          result.current.toggleSelectionMode();
        });

        expect(result.current.isSelectionMode).toBe(true);
      });

      it('should toggle isSelectionMode from true to false', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <BulkSelectionProvider>{children}</BulkSelectionProvider>
        );

        const { result } = renderHook(() => useBulkSelection(), { wrapper });

        act(() => {
          result.current.toggleSelectionMode();
        });
        expect(result.current.isSelectionMode).toBe(true);

        act(() => {
          result.current.toggleSelectionMode();
        });
        expect(result.current.isSelectionMode).toBe(false);
      });

      it('should clear selections when exiting selection mode', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <BulkSelectionProvider>{children}</BulkSelectionProvider>
        );

        const { result } = renderHook(() => useBulkSelection(), { wrapper });

        // Enter selection mode and select items
        act(() => {
          result.current.toggleSelectionMode();
          result.current.selectAll(['id1', 'id2']);
        });
        expect(result.current.selectedIds.size).toBe(2);

        // Exit selection mode
        act(() => {
          result.current.toggleSelectionMode();
        });
        expect(result.current.selectedIds.size).toBe(0);
      });
    });

    describe('toggleSelection', () => {
      it('should add id to selectedIds when not present', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <BulkSelectionProvider>{children}</BulkSelectionProvider>
        );

        const { result } = renderHook(() => useBulkSelection(), { wrapper });

        act(() => {
          result.current.toggleSelection('id1');
        });

        expect(result.current.selectedIds.has('id1')).toBe(true);
      });

      it('should remove id from selectedIds when present', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <BulkSelectionProvider>{children}</BulkSelectionProvider>
        );

        const { result } = renderHook(() => useBulkSelection(), { wrapper });

        act(() => {
          result.current.toggleSelection('id1');
        });
        expect(result.current.selectedIds.has('id1')).toBe(true);

        act(() => {
          result.current.toggleSelection('id1');
        });
        expect(result.current.selectedIds.has('id1')).toBe(false);
      });

      it('should handle multiple toggles correctly', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <BulkSelectionProvider>{children}</BulkSelectionProvider>
        );

        const { result } = renderHook(() => useBulkSelection(), { wrapper });

        act(() => {
          result.current.toggleSelection('id1');
          result.current.toggleSelection('id2');
          result.current.toggleSelection('id3');
        });

        expect(result.current.selectedIds.size).toBe(3);

        act(() => {
          result.current.toggleSelection('id2');
        });

        expect(result.current.selectedIds.size).toBe(2);
        expect(result.current.selectedIds.has('id1')).toBe(true);
        expect(result.current.selectedIds.has('id2')).toBe(false);
        expect(result.current.selectedIds.has('id3')).toBe(true);
      });
    });

    describe('selectAll', () => {
      it('should replace selectedIds with provided ids', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <BulkSelectionProvider>{children}</BulkSelectionProvider>
        );

        const { result } = renderHook(() => useBulkSelection(), { wrapper });

        act(() => {
          result.current.selectAll(['id1', 'id2', 'id3']);
        });

        expect(result.current.selectedIds.size).toBe(3);
        expect(result.current.selectedIds.has('id1')).toBe(true);
        expect(result.current.selectedIds.has('id2')).toBe(true);
        expect(result.current.selectedIds.has('id3')).toBe(true);
      });

      it('should handle empty array', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <BulkSelectionProvider>{children}</BulkSelectionProvider>
        );

        const { result } = renderHook(() => useBulkSelection(), { wrapper });

        act(() => {
          result.current.selectAll([]);
        });

        expect(result.current.selectedIds.size).toBe(0);
      });

      it('should replace existing selections', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <BulkSelectionProvider>{children}</BulkSelectionProvider>
        );

        const { result } = renderHook(() => useBulkSelection(), { wrapper });

        act(() => {
          result.current.selectAll(['id1', 'id2']);
        });
        expect(result.current.selectedIds.size).toBe(2);

        act(() => {
          result.current.selectAll(['id3']);
        });
        expect(result.current.selectedIds.size).toBe(1);
        expect(result.current.selectedIds.has('id3')).toBe(true);
      });
    });

    describe('deselectAll', () => {
      it('should clear all selections', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <BulkSelectionProvider>{children}</BulkSelectionProvider>
        );

        const { result } = renderHook(() => useBulkSelection(), { wrapper });

        act(() => {
          result.current.selectAll(['id1', 'id2', 'id3']);
        });
        expect(result.current.selectedIds.size).toBe(3);

        act(() => {
          result.current.deselectAll();
        });
        expect(result.current.selectedIds.size).toBe(0);
      });

      it('should work when already empty', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <BulkSelectionProvider>{children}</BulkSelectionProvider>
        );

        const { result } = renderHook(() => useBulkSelection(), { wrapper });

        act(() => {
          result.current.deselectAll();
        });
        expect(result.current.selectedIds.size).toBe(0);
      });
    });

    describe('isSelected', () => {
      it('should return true for selected ids', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <BulkSelectionProvider>{children}</BulkSelectionProvider>
        );

        const { result } = renderHook(() => useBulkSelection(), { wrapper });

        act(() => {
          result.current.toggleSelection('id1');
        });

        expect(result.current.isSelected('id1')).toBe(true);
      });

      it('should return false for unselected ids', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <BulkSelectionProvider>{children}</BulkSelectionProvider>
        );

        const { result } = renderHook(() => useBulkSelection(), { wrapper });

        expect(result.current.isSelected('id1')).toBe(false);
      });

      it('should return correct values after multiple operations', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <BulkSelectionProvider>{children}</BulkSelectionProvider>
        );

        const { result } = renderHook(() => useBulkSelection(), { wrapper });

        act(() => {
          result.current.selectAll(['id1', 'id2', 'id3']);
        });
        expect(result.current.isSelected('id1')).toBe(true);
        expect(result.current.isSelected('id2')).toBe(true);
        expect(result.current.isSelected('id4')).toBe(false);

        act(() => {
          result.current.toggleSelection('id2');
        });
        expect(result.current.isSelected('id2')).toBe(false);
      });
    });
  });
});
