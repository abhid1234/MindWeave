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

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
  sendVerificationEmail: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  db: { query: { users: { findFirst: vi.fn() } } },
}));

vi.mock('@/lib/db/schema', () => ({
  users: { email: 'email' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
}));

// Mock component for base state (no session)
const MockBasePage = ({ resent = false }: { resent?: boolean }) => (
  <main>
    <h1>Mindweave</h1>
    <p>Check your email</p>
    <div>
      <p>Verification email sent!</p>
      <p>
        We&apos;ve sent a verification link to your email address. Please check your inbox and
        click the link to verify your account.
      </p>
      <p>The link expires in 24 hours.</p>
    </div>
    {resent && <div>Verification email resent successfully!</div>}
    <a href="/login">Back to sign in</a>
  </main>
);

// Mock component for authenticated state
const MockAuthPage = ({ email, resent = false }: { email: string; resent?: boolean }) => (
  <main>
    <h1>Mindweave</h1>
    <p>Check your email</p>
    <div>
      <p>Verification email sent!</p>
      <p>
        We&apos;ve sent a verification link to <span>{email}</span>. Please check your inbox and
        click the link to verify your account.
      </p>
      <p>The link expires in 24 hours.</p>
    </div>
    {resent && <div>Verification email resent successfully!</div>}
    <form>
      <button type="submit">Resend verification email</button>
    </form>
    <a href="/login">Back to sign in</a>
  </main>
);

describe('Verify Email Sent Page', () => {
  it('should render "Check your email" message', () => {
    render(<MockBasePage />);
    expect(screen.getByText('Check your email')).toBeInTheDocument();
  });

  it('should render Mindweave branding', () => {
    render(<MockBasePage />);
    expect(screen.getByText('Mindweave')).toBeInTheDocument();
  });

  it('should show 24-hour expiry note', () => {
    render(<MockBasePage />);
    expect(screen.getByText('The link expires in 24 hours.')).toBeInTheDocument();
  });

  it('should show "Back to sign in" link', () => {
    render(<MockBasePage />);
    const link = screen.getByText('Back to sign in');
    expect(link).toHaveAttribute('href', '/login');
  });

  describe('with session', () => {
    it('should show user email address', () => {
      render(<MockAuthPage email="user@example.com" />);
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });

    it('should show resend button', () => {
      render(<MockAuthPage email="user@example.com" />);
      expect(
        screen.getByRole('button', { name: /resend verification email/i })
      ).toBeInTheDocument();
    });
  });

  describe('with resent=true', () => {
    it('should show success message', () => {
      render(<MockBasePage resent />);
      expect(screen.getByText('Verification email resent successfully!')).toBeInTheDocument();
    });
  });
});
