import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocsSidebar } from './DocsSidebar';
import { docsNavConfig } from './docs-nav-config';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

// Mock next/navigation with a controllable mock
const mockUsePathname = vi.fn().mockReturnValue('/docs');
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('DocsSidebar', () => {
  it('should render the navigation landmark', () => {
    render(<DocsSidebar />);
    expect(screen.getByRole('navigation', { name: /documentation/i })).toBeInTheDocument();
  });

  it('should render all section headings', () => {
    render(<DocsSidebar />);
    for (const section of docsNavConfig) {
      expect(screen.getByText(section.label)).toBeInTheDocument();
    }
  });

  it('should render all navigation items', () => {
    render(<DocsSidebar />);
    for (const section of docsNavConfig) {
      for (const item of section.items) {
        expect(screen.getByText(item.label)).toBeInTheDocument();
      }
    }
  });

  it('should render links with correct hrefs', () => {
    render(<DocsSidebar />);
    const links = screen.getAllByRole('link');
    const allHrefs = docsNavConfig.flatMap((s) => s.items.map((i) => i.href));
    for (const href of allHrefs) {
      expect(links.find((l) => l.getAttribute('href') === href)).toBeTruthy();
    }
  });

  it('should highlight the active page', () => {
    render(<DocsSidebar />);
    const activeLink = screen.getByText('Introduction').closest('a');
    expect(activeLink).toHaveClass('bg-primary/10');
    expect(activeLink).toHaveClass('text-primary');
  });

  it('should not highlight non-active pages', () => {
    render(<DocsSidebar />);
    const inactiveLink = screen.getByText('Getting Started').closest('a');
    expect(inactiveLink).toHaveClass('text-muted-foreground');
    expect(inactiveLink).not.toHaveClass('text-primary');
  });
});

describe('DocsSidebar with different pathname', () => {
  it('should highlight the correct active page for features path', () => {
    mockUsePathname.mockReturnValue('/docs/features/search');

    render(<DocsSidebar />);
    const activeLink = screen.getByText('Search').closest('a');
    expect(activeLink).toHaveClass('bg-primary/10');
    expect(activeLink).toHaveClass('text-primary');

    const introLink = screen.getByText('Introduction').closest('a');
    expect(introLink).not.toHaveClass('text-primary');
  });
});
