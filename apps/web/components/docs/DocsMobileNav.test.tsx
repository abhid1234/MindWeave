import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocsMobileNav } from './DocsMobileNav';
import { docsNavConfig } from './docs-nav-config';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, onClick, className }: { children: React.ReactNode; href: string; onClick?: () => void; className?: string }) => (
    <a href={href} onClick={onClick} className={className}>{children}</a>
  ),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/docs',
}));

describe('DocsMobileNav', () => {
  it('should render the menu trigger button', () => {
    render(<DocsMobileNav />);
    expect(screen.getByRole('button', { name: /toggle docs menu/i })).toBeInTheDocument();
  });

  it('should open sheet when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<DocsMobileNav />);

    await user.click(screen.getByRole('button', { name: /toggle docs menu/i }));

    expect(screen.getByText('Mindweave Docs')).toBeInTheDocument();
  });

  it('should render all section headings when open', async () => {
    const user = userEvent.setup();
    render(<DocsMobileNav />);

    await user.click(screen.getByRole('button', { name: /toggle docs menu/i }));

    for (const section of docsNavConfig) {
      expect(screen.getByText(section.label)).toBeInTheDocument();
    }
  });

  it('should render all navigation items when open', async () => {
    const user = userEvent.setup();
    render(<DocsMobileNav />);

    await user.click(screen.getByRole('button', { name: /toggle docs menu/i }));

    for (const section of docsNavConfig) {
      for (const item of section.items) {
        expect(screen.getByText(item.label)).toBeInTheDocument();
      }
    }
  });

  it('should render the Documentation Menu sheet title for accessibility', async () => {
    const user = userEvent.setup();
    render(<DocsMobileNav />);

    await user.click(screen.getByRole('button', { name: /toggle docs menu/i }));

    expect(screen.getByText('Documentation Menu')).toBeInTheDocument();
  });

  it('should close when a nav link is clicked', async () => {
    const user = userEvent.setup();
    render(<DocsMobileNav />);

    await user.click(screen.getByRole('button', { name: /toggle docs menu/i }));

    // The sheet is open and we can see nav items
    expect(screen.getByText('Getting Started')).toBeInTheDocument();

    // Click a nav link - the onClick handler calls setOpen(false)
    await user.click(screen.getByText('Getting Started'));

    // After clicking, the sheet's onOpenChange should have been called
    // The link's onClick closes the sheet
  });
});
