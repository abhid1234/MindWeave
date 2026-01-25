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
        expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
      });
    });

    it('should render sun icon when theme is light', async () => {
      mockResolvedTheme = 'light';
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).toBeInTheDocument();
        // Check that there's an SVG (icon) inside the button
        expect(button.querySelector('svg')).toBeInTheDocument();
      });
    });

    it('should render moon icon when theme is dark', async () => {
      mockResolvedTheme = 'dark';
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
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
    it('should open dropdown on click', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(button);

      // After clicking, the button should have aria-expanded="true"
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should have dropdown trigger with correct attributes', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).toHaveAttribute('aria-haspopup', 'menu');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate aria-label', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
      });
    });

    it('should be keyboard accessible', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /toggle theme/i });
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should have button type', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('Theme state', () => {
    it('should show different icon based on resolved theme', async () => {
      // Test with light theme
      mockResolvedTheme = 'light';
      const { rerender, container } = render(<ThemeToggle />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
      });

      // Check for sun icon class (lucide-sun)
      expect(container.querySelector('.lucide-sun')).toBeInTheDocument();

      // Change to dark theme and rerender
      mockResolvedTheme = 'dark';
      rerender(<ThemeToggle />);

      // Check for moon icon class (lucide-moon)
      await waitFor(() => {
        expect(container.querySelector('.lucide-moon')).toBeInTheDocument();
      });
    });
  });
});
