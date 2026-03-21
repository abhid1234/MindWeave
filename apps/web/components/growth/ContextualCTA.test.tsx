import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContextualCTA } from './ContextualCTA';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => {
    if (asChild) return <span>{children}</span>;
    return <button>{children}</button>;
  },
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  ArrowRight: () => <svg data-testid="arrow-right-icon" />,
}));

describe('ContextualCTA', () => {
  it('renders til variant with correct text', () => {
    render(<ContextualCTA variant="til" />);
    expect(screen.getByText('Start sharing what you learn')).toBeInTheDocument();
    expect(screen.getByText('Publish your own TILs and join the community.')).toBeInTheDocument();
  });

  it('renders marketplace variant with correct text', () => {
    render(<ContextualCTA variant="marketplace" />);
    expect(screen.getByText('Clone this collection to your library')).toBeInTheDocument();
    expect(
      screen.getByText('Sign up to save and organize knowledge your way.')
    ).toBeInTheDocument();
  });

  it('renders share variant with correct text', () => {
    render(<ContextualCTA variant="share" />);
    expect(screen.getByText('Save this to your Mindweave')).toBeInTheDocument();
    expect(screen.getByText('Build your own AI-powered knowledge hub.')).toBeInTheDocument();
  });

  it('renders profile variant with correct text', () => {
    render(<ContextualCTA variant="profile" />);
    expect(screen.getByText('Build your public knowledge profile')).toBeInTheDocument();
    expect(
      screen.getByText('Showcase your expertise and share what you know.')
    ).toBeInTheDocument();
  });

  it('renders comparison variant with correct text', () => {
    render(<ContextualCTA variant="comparison" />);
    expect(screen.getByText('Try Mindweave free')).toBeInTheDocument();
    expect(
      screen.getByText('AI-powered knowledge management — no credit card required.')
    ).toBeInTheDocument();
  });

  it('renders a link to /auth/register for all variants', () => {
    render(<ContextualCTA variant="til" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/auth/register');
  });
});
