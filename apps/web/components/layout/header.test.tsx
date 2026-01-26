import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, width, height, className }: any) => (
    <img src={src} alt={alt} width={width} height={height} className={className} />
  ),
}));

// Mock signOut function
vi.mock('@/lib/auth', () => ({
  signOut: vi.fn(),
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

    it('should render user name', () => {
      render(<Header user={mockUser} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render user email', () => {
      render(<Header user={mockUser} />);
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('should render user avatar when image is provided', () => {
      render(<Header user={mockUser} />);
      // There are two avatars - one for desktop, one for mobile
      const avatars = screen.getAllByAltText('John Doe');
      expect(avatars.length).toBeGreaterThanOrEqual(1);
      expect(avatars[0]).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should render sign out button', () => {
      render(<Header user={mockUser} />);
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
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
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('should handle user without name', () => {
      const userWithoutName = {
        name: null,
        email: 'user@example.com',
        image: 'https://example.com/avatar.jpg',
      };
      render(<Header user={userWithoutName} />);
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });
  });

  describe('Sign Out Functionality', () => {
    it('should have sign out form', () => {
      render(<Header user={mockUser} />);
      const button = screen.getByRole('button', { name: /sign out/i });
      expect(button.closest('form')).toBeInTheDocument();
    });

    it('should have submit button type', () => {
      render(<Header user={mockUser} />);
      const button = screen.getByRole('button', { name: /sign out/i });
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should be clickable', () => {
      render(<Header user={mockUser} />);
      const button = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(button);
      // Button click should trigger form submission
      expect(button).toBeInTheDocument();
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
      // There are two avatars - one for desktop, one for mobile
      const avatars = screen.getAllByAltText('John Doe');
      expect(avatars[0]).toHaveClass('rounded-full');
    });

    it('should have styled sign out button', () => {
      render(<Header user={mockUser} />);
      const button = screen.getByRole('button', { name: /sign out/i });
      expect(button).toHaveClass('rounded-lg');
    });
  });

  describe('Accessibility', () => {
    it('should use semantic header element', () => {
      render(<Header user={mockUser} />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should have accessible button', () => {
      render(<Header user={mockUser} />);
      const button = screen.getByRole('button', { name: /sign out/i });
      expect(button).toBeVisible();
    });

    it('should have alt text for avatar image', () => {
      render(<Header user={mockUser} />);
      // There are two avatars - one for desktop, one for mobile
      const avatars = screen.getAllByAltText('John Doe');
      expect(avatars[0]).toHaveAccessibleName();
    });
  });
});
