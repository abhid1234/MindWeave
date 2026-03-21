import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignupBanner } from './SignupBanner';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock analytics tracker
vi.mock('@/lib/analytics/tracker', () => ({
  trackEvent: vi.fn(),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  X: () => <svg data-testid="x-icon" />,
}));

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    asChild,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    asChild?: boolean;
    onClick?: () => void;
    [key: string]: unknown;
  }) => {
    if (asChild && onClick) {
      // Pass onClick to the child
      return <span onClick={onClick}>{children}</span>;
    }
    if (asChild) return <span>{children}</span>;
    return (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    );
  },
}));

describe('SignupBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear cookies
    document.cookie = 'mw_banner_dismissed=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
  });

  it('renders the banner with user count', () => {
    render(<SignupBanner userCount={1500} />);
    expect(screen.getByText(/Join 1,500\+ knowledge builders on Mindweave/)).toBeInTheDocument();
  });

  it('renders the Sign Up Free link pointing to /auth/register', () => {
    render(<SignupBanner userCount={500} />);
    const link = screen.getByRole('link', { name: /Sign Up Free/i });
    expect(link).toHaveAttribute('href', '/auth/register');
  });

  it('dismisses the banner when close button is clicked', () => {
    render(<SignupBanner userCount={500} />);
    const dismissButton = screen.getByRole('button', { name: /Dismiss banner/i });
    fireEvent.click(dismissButton);
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });

  it('is hidden when mw_banner_dismissed cookie exists', () => {
    // Set the cookie before rendering
    document.cookie = 'mw_banner_dismissed=1; path=/';
    render(<SignupBanner userCount={500} />);
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });
});
