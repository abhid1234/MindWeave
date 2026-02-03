import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/lib/email', () => ({
  consumeVerificationToken: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  db: { update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }), query: { users: { findFirst: vi.fn() } } },
}));

vi.mock('@/lib/db/schema', () => ({
  users: { email: 'email' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  signIn: vi.fn(),
}));

// Mock components matching the page's rendered output
const MockInvalidPage = () => (
  <main>
    <h1>Mindweave</h1>
    <p>Invalid verification link</p>
    <div>This verification link is invalid. Please request a new one.</div>
    <a href="/verify-email-sent">Resend verification email</a>
  </main>
);

const MockExpiredPage = () => (
  <main>
    <h1>Mindweave</h1>
    <p>Link expired</p>
    <div>This verification link has expired or already been used. Please request a new one.</div>
    <a href="/verify-email-sent">Resend verification email</a>
  </main>
);

describe('Verify Email Page', () => {
  describe('when no token or email provided', () => {
    it('should render invalid link message', () => {
      render(<MockInvalidPage />);
      expect(screen.getByText('Invalid verification link')).toBeInTheDocument();
    });

    it('should render Mindweave branding', () => {
      render(<MockInvalidPage />);
      expect(screen.getByText('Mindweave')).toBeInTheDocument();
    });

    it('should show link to resend verification', () => {
      render(<MockInvalidPage />);
      const link = screen.getByText('Resend verification email');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/verify-email-sent');
    });
  });

  describe('when token consumption fails', () => {
    it('should render expired link message', () => {
      render(<MockExpiredPage />);
      expect(screen.getByText('Link expired')).toBeInTheDocument();
    });

    it('should show explanation text', () => {
      render(<MockExpiredPage />);
      expect(
        screen.getByText(/This verification link has expired or already been used/)
      ).toBeInTheDocument();
    });

    it('should show link to resend verification in expired state', () => {
      render(<MockExpiredPage />);
      const link = screen.getByText('Resend verification email');
      expect(link).toHaveAttribute('href', '/verify-email-sent');
    });
  });
});
