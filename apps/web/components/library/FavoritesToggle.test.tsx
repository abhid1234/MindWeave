import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FavoritesToggle } from './FavoritesToggle';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe('FavoritesToggle', () => {
  const mockPush = vi.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete('favorites');
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as any);
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);
  });

  describe('Rendering', () => {
    it('should render the button with Favorites label', () => {
      render(<FavoritesToggle />);
      expect(screen.getByRole('button', { name: /favorites/i })).toBeInTheDocument();
    });

    it('should render with outline variant when favorites is not active', () => {
      render(<FavoritesToggle />);
      const button = screen.getByRole('button', { name: /favorites/i });
      expect(button).toHaveClass('border');
    });

    it('should render with default variant when favorites is active', () => {
      mockSearchParams.set('favorites', 'true');
      render(<FavoritesToggle />);
      const button = screen.getByRole('button', { name: /favorites/i });
      expect(button).toHaveClass('bg-primary');
    });
  });

  describe('Star Icon', () => {
    it('should render star icon unfilled when favorites is not active', () => {
      render(<FavoritesToggle />);
      const svg = screen.getByRole('button', { name: /favorites/i }).querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).not.toHaveClass('fill-current');
    });

    it('should render star icon filled when favorites is active', () => {
      mockSearchParams.set('favorites', 'true');
      render(<FavoritesToggle />);
      const svg = screen.getByRole('button', { name: /favorites/i }).querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('fill-current');
    });
  });

  describe('Toggle Behavior', () => {
    it('should add favorites=true to URL when clicking while inactive', () => {
      render(<FavoritesToggle />);
      const button = screen.getByRole('button', { name: /favorites/i });

      fireEvent.click(button);

      expect(mockPush).toHaveBeenCalledWith('/dashboard/library?favorites=true');
    });

    it('should remove favorites param from URL when clicking while active', () => {
      mockSearchParams.set('favorites', 'true');
      render(<FavoritesToggle />);
      const button = screen.getByRole('button', { name: /favorites/i });

      fireEvent.click(button);

      expect(mockPush).toHaveBeenCalledWith('/dashboard/library?');
    });

    it('should preserve other URL params when toggling on', () => {
      mockSearchParams.set('type', 'note');
      mockSearchParams.set('sortBy', 'title');
      render(<FavoritesToggle />);
      const button = screen.getByRole('button', { name: /favorites/i });

      fireEvent.click(button);

      const calledUrl = mockPush.mock.calls[0][0];
      expect(calledUrl).toContain('type=note');
      expect(calledUrl).toContain('sortBy=title');
      expect(calledUrl).toContain('favorites=true');
    });

    it('should preserve other URL params when toggling off', () => {
      mockSearchParams.set('favorites', 'true');
      mockSearchParams.set('type', 'link');
      render(<FavoritesToggle />);
      const button = screen.getByRole('button', { name: /favorites/i });

      fireEvent.click(button);

      const calledUrl = mockPush.mock.calls[0][0];
      expect(calledUrl).toContain('type=link');
      expect(calledUrl).not.toContain('favorites=');
    });
  });
});
