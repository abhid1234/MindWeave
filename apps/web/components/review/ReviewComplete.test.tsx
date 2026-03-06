import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReviewComplete } from './ReviewComplete';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('ReviewComplete', () => {
  it('should display completion message', () => {
    render(<ReviewComplete reviewedCount={5} />);
    expect(screen.getByText('All caught up!')).toBeInTheDocument();
  });

  it('should display reviewed count with plural', () => {
    render(<ReviewComplete reviewedCount={5} />);
    expect(screen.getByText('You reviewed 5 items today.')).toBeInTheDocument();
  });

  it('should display singular for 1 item', () => {
    render(<ReviewComplete reviewedCount={1} />);
    expect(screen.getByText('You reviewed 1 item today.')).toBeInTheDocument();
  });
});
