import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavLinks } from './nav';

// Mock next/navigation
const mockPathname = vi.fn().mockReturnValue('/dashboard');
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, onClick, className }: { children: React.ReactNode; href: string; onClick?: () => void; className?: string }) => (
    <a href={href} onClick={onClick} className={className}>{children}</a>
  ),
}));

describe('NavLinks', () => {
  it('should render all 14 nav items', () => {
    render(<NavLinks />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Capture')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Ask AI')).toBeInTheDocument();
    expect(screen.getByText('Discover')).toBeInTheDocument();
    expect(screen.getByText('Create Post')).toBeInTheDocument();
    expect(screen.getByText('Wrapped')).toBeInTheDocument();
    expect(screen.getByText('Connections')).toBeInTheDocument();
    expect(screen.getByText('Graph')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('should render correct hrefs', () => {
    render(<NavLinks />);

    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));

    expect(hrefs).toContain('/dashboard');
    expect(hrefs).toContain('/dashboard/capture');
    expect(hrefs).toContain('/dashboard/import');
    expect(hrefs).toContain('/dashboard/search');
    expect(hrefs).toContain('/dashboard/ask');
    expect(hrefs).toContain('/dashboard/discover');
    expect(hrefs).toContain('/dashboard/create-post');
    expect(hrefs).toContain('/dashboard/graph');
    expect(hrefs).toContain('/dashboard/library');
    expect(hrefs).toContain('/dashboard/tasks');
    expect(hrefs).toContain('/dashboard/analytics');
    expect(hrefs).toContain('/dashboard/profile');
  });

  it('should apply active styling to current path', () => {
    mockPathname.mockReturnValue('/dashboard/search');
    render(<NavLinks />);

    const searchLink = screen.getByText('Search').closest('a');
    expect(searchLink?.className).toContain('bg-primary/10');
    expect(searchLink?.className).toContain('text-primary');
  });

  it('should apply inactive styling to non-current paths', () => {
    mockPathname.mockReturnValue('/dashboard');
    render(<NavLinks />);

    const searchLink = screen.getByText('Search').closest('a');
    expect(searchLink?.className).toContain('text-muted-foreground');
  });

  it('should call onNavigate when a link is clicked', async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(<NavLinks onNavigate={onNavigate} />);

    await user.click(screen.getByText('Library'));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('should render without onNavigate prop', () => {
    render(<NavLinks />);
    expect(screen.getAllByRole('link')).toHaveLength(14);
  });
});
