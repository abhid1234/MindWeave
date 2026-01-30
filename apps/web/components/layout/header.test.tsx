import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, width, height, className }: any) => (
    <img src={src} alt={alt} width={width} height={height} className={className} />
  ),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, className }: any) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

// Mock signOut function
vi.mock('@/lib/auth', () => ({
  signOut: vi.fn(),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'system', setTheme: vi.fn(), resolvedTheme: 'light' }),
}));

// Mock auth action
vi.mock('@/app/actions/auth', () => ({
  signOutAction: vi.fn(),
}));

// Mock MobileNav
vi.mock('./MobileNav', () => ({
  MobileNav: () => <div data-testid="mobile-nav" />,
}));

// Import the actual component after mocks
import Header from './header';

describe('Header Component', () => {
  const mockUser = {
    name: 'John Doe',
    email: 'john@example.com',
    image: 'https://example.com/avatar.jpg',
  };

  describe('Rendering', () => {
    it('should render the header', () => {
      render(<Header user={mockUser} />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should render the app title', () => {
      render(<Header user={mockUser} />);
      expect(screen.getByText('Mindweave')).toBeInTheDocument();
    });

    it('should render user menu button', () => {
      render(<Header user={mockUser} />);
      expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument();
    });

    it('should render user avatar in the menu trigger', () => {
      render(<Header user={mockUser} />);
      const avatar = screen.getByAltText('John Doe');
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });
  });

  describe('User Display', () => {
    it('should handle user without image', () => {
      const userWithoutImage = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        image: null,
      };
      render(<Header user={userWithoutImage} />);
      // Should still render the menu button (with fallback icon)
      expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have proper header structure', () => {
      render(<Header user={mockUser} />);
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('border-b');
    });

    it('should have rounded avatar', () => {
      render(<Header user={mockUser} />);
      const avatar = screen.getByAltText('John Doe');
      expect(avatar).toHaveClass('rounded-full');
    });
  });

  describe('Accessibility', () => {
    it('should use semantic header element', () => {
      render(<Header user={mockUser} />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should have accessible user menu button', () => {
      render(<Header user={mockUser} />);
      const button = screen.getByRole('button', { name: /user menu/i });
      expect(button).toBeVisible();
    });

    it('should have alt text for avatar image', () => {
      render(<Header user={mockUser} />);
      const avatar = screen.getByAltText('John Doe');
      expect(avatar).toHaveAccessibleName();
    });
  });
});
