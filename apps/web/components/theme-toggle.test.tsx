import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from './theme-toggle';

// Mock useTheme hook
const mockSetTheme = vi.fn();
let mockTheme = 'system';
let mockResolvedTheme = 'light';

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
    resolvedTheme: mockResolvedTheme,
  }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
    mockTheme = 'system';
    mockResolvedTheme = 'light';
  });

  describe('Rendering', () => {
    it('should render toggle button', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /switch to/i })).toBeInTheDocument();
      });
    });

    it('should render sun icon when theme is light', async () => {
      mockTheme = 'light';
      mockResolvedTheme = 'light';
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /switch to dark mode/i });
        expect(button).toBeInTheDocument();
        expect(button.querySelector('svg')).toBeInTheDocument();
      });
    });

    it('should render moon icon when theme is dark', async () => {
      mockTheme = 'dark';
      mockResolvedTheme = 'dark';
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /switch to system mode/i });
        expect(button).toBeInTheDocument();
        expect(button.querySelector('svg')).toBeInTheDocument();
      });
    });

    it('should show placeholder before mount', () => {
      // This test verifies the initial placeholder renders
      render(<ThemeToggle />);
      // The button should exist (either placeholder or real)
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should cycle from light to dark on click', async () => {
      mockTheme = 'light';
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /switch to dark mode/i });
      await user.click(button);

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should cycle from dark to system on click', async () => {
      mockTheme = 'dark';
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /switch to system mode/i })).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /switch to system mode/i });
      await user.click(button);

      expect(mockSetTheme).toHaveBeenCalledWith('system');
    });

    it('should cycle from system to light on click', async () => {
      mockTheme = 'system';
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /switch to light mode/i });
      await user.click(button);

      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate aria-label', async () => {
      mockTheme = 'light';
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
      });
    });

    it('should be keyboard accessible', async () => {
      mockTheme = 'light';
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /switch to dark mode/i });
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should have button role', async () => {
      mockTheme = 'light';
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /switch to dark mode/i });
        expect(button.tagName).toBe('BUTTON');
      });
    });
  });

  describe('Theme state', () => {
    it('should show different icon based on theme', async () => {
      // Test with light theme
      mockTheme = 'light';
      mockResolvedTheme = 'light';
      const { rerender, container } = render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
      });

      // Check for sun icon class (lucide-sun)
      expect(container.querySelector('.lucide-sun')).toBeInTheDocument();

      // Change to dark theme and rerender
      mockTheme = 'dark';
      mockResolvedTheme = 'dark';
      rerender(<ThemeToggle />);

      // Check for moon icon class (lucide-moon)
      await waitFor(() => {
        expect(container.querySelector('.lucide-moon')).toBeInTheDocument();
      });
    });
  });
});
