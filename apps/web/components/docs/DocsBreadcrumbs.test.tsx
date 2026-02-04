import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocsBreadcrumbs } from './DocsBreadcrumbs';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('DocsBreadcrumbs', () => {
  it('should not render breadcrumbs on the docs root page', () => {
    mockUsePathname.mockReturnValue('/docs');
    const { container } = render(<DocsBreadcrumbs />);
    expect(container.querySelector('nav')).toBeNull();
  });

  it('should render breadcrumbs for getting-started page', () => {
    mockUsePathname.mockReturnValue('/docs/getting-started');
    render(<DocsBreadcrumbs />);

    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    expect(screen.getByText('Docs')).toBeInTheDocument();
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
  });

  it('should render breadcrumbs for a feature sub-page', () => {
    mockUsePathname.mockReturnValue('/docs/features/capture');
    render(<DocsBreadcrumbs />);

    expect(screen.getByText('Docs')).toBeInTheDocument();
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Content Capture')).toBeInTheDocument();
  });

  it('should make the last breadcrumb a non-link', () => {
    mockUsePathname.mockReturnValue('/docs/features/capture');
    render(<DocsBreadcrumbs />);

    const captureEl = screen.getByText('Content Capture');
    expect(captureEl.tagName).toBe('SPAN');
    expect(captureEl).toHaveClass('font-medium');
  });

  it('should make intermediate breadcrumbs links', () => {
    mockUsePathname.mockReturnValue('/docs/features/capture');
    render(<DocsBreadcrumbs />);

    const docsLink = screen.getByText('Docs').closest('a');
    expect(docsLink).toHaveAttribute('href', '/docs');

    const featuresLink = screen.getByText('Features').closest('a');
    expect(featuresLink).toHaveAttribute('href', '/docs/features');
  });

  it('should render breadcrumbs for the FAQ page', () => {
    mockUsePathname.mockReturnValue('/docs/faq');
    render(<DocsBreadcrumbs />);

    expect(screen.getByText('Docs')).toBeInTheDocument();
    expect(screen.getByText('FAQ')).toBeInTheDocument();
  });

  it('should render breadcrumbs for the account page', () => {
    mockUsePathname.mockReturnValue('/docs/account');
    render(<DocsBreadcrumbs />);

    expect(screen.getByText('Docs')).toBeInTheDocument();
    expect(screen.getByText('Account & Settings')).toBeInTheDocument();
  });

  it('should render breadcrumbs for features overview page', () => {
    mockUsePathname.mockReturnValue('/docs/features');
    render(<DocsBreadcrumbs />);

    // Should show "Docs > Features Overview"
    expect(screen.getByText('Docs')).toBeInTheDocument();
    expect(screen.getByText('Features Overview')).toBeInTheDocument();
  });

  it('should include separator icons between breadcrumbs', () => {
    mockUsePathname.mockReturnValue('/docs/features/search');
    render(<DocsBreadcrumbs />);

    // There should be ChevronRight separators (rendered as svg)
    const nav = screen.getByRole('navigation');
    const svgs = nav.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});
