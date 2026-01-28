import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileNav } from './MobileNav';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, onClick, className }: { children: React.ReactNode; href: string; onClick?: () => void; className?: string }) => (
    <a href={href} onClick={onClick} className={className}>{children}</a>
  ),
}));

describe('MobileNav', () => {
  it('should render the menu trigger button', () => {
    render(<MobileNav />);
    expect(screen.getByRole('button', { name: /toggle menu/i })).toBeInTheDocument();
  });

  it('should open sheet when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole('button', { name: /toggle menu/i }));

    expect(screen.getByText('Mindweave')).toBeInTheDocument();
  });

  it('should render NavLinks inside the sheet', async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole('button', { name: /toggle menu/i }));

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
  });
});
