import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocsHeader } from './DocsHeader';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/docs',
}));

// Mock DocsMobileNav to simplify testing
vi.mock('./DocsMobileNav', () => ({
  DocsMobileNav: () => <div data-testid="docs-mobile-nav" />,
}));

describe('DocsHeader', () => {
  it('should render the header element', () => {
    render(<DocsHeader />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should render the Mindweave Docs title', () => {
    render(<DocsHeader />);
    expect(screen.getByText('Mindweave Docs')).toBeInTheDocument();
  });

  it('should link the title to /docs', () => {
    render(<DocsHeader />);
    const titleLink = screen.getByText('Mindweave Docs').closest('a');
    expect(titleLink).toHaveAttribute('href', '/docs');
  });

  it('should render the back-to-app link', () => {
    render(<DocsHeader />);
    const backLink = screen.getByText('Back to app');
    expect(backLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('should render the mobile nav component', () => {
    render(<DocsHeader />);
    expect(screen.getByTestId('docs-mobile-nav')).toBeInTheDocument();
  });

  it('should only be visible on mobile (lg:hidden class)', () => {
    render(<DocsHeader />);
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('lg:hidden');
  });

  it('should have sticky positioning', () => {
    render(<DocsHeader />);
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('sticky');
    expect(header).toHaveClass('top-0');
  });
});
