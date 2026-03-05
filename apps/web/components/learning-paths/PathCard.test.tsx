import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PathCard } from './PathCard';
import type { LearningPathSummary } from '@/app/actions/learning-paths';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('PathCard', () => {
  const basePath: LearningPathSummary = {
    id: 'path-1',
    title: 'Learn React',
    description: 'A comprehensive guide to React',
    estimatedMinutes: 120,
    difficulty: 'intermediate',
    isPublic: false,
    createdAt: new Date('2024-01-01'),
    itemCount: 10,
    completedCount: 3,
  };

  it('should render path title', () => {
    render(<PathCard path={basePath} />);
    expect(screen.getByText('Learn React')).toBeInTheDocument();
  });

  it('should render description', () => {
    render(<PathCard path={basePath} />);
    expect(screen.getByText('A comprehensive guide to React')).toBeInTheDocument();
  });

  it('should render difficulty badge', () => {
    render(<PathCard path={basePath} />);
    expect(screen.getByText('intermediate')).toBeInTheDocument();
  });

  it('should render estimated time', () => {
    render(<PathCard path={basePath} />);
    expect(screen.getByText('120m')).toBeInTheDocument();
  });

  it('should render item count', () => {
    render(<PathCard path={basePath} />);
    expect(screen.getByText('10 items')).toBeInTheDocument();
  });

  it('should render progress bar when there are items', () => {
    render(<PathCard path={basePath} />);
    expect(screen.getByText('3/10 complete')).toBeInTheDocument();
  });

  it('should not render progress bar when itemCount is 0', () => {
    render(<PathCard path={{ ...basePath, itemCount: 0, completedCount: 0 }} />);
    expect(screen.queryByText('complete')).not.toBeInTheDocument();
  });

  it('should link to path detail page', () => {
    render(<PathCard path={basePath} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/dashboard/learning-paths/path-1');
  });

  it('should not render description if null', () => {
    render(<PathCard path={{ ...basePath, description: null }} />);
    expect(screen.queryByText('A comprehensive guide to React')).not.toBeInTheDocument();
  });

  it('should not render difficulty if null', () => {
    render(<PathCard path={{ ...basePath, difficulty: null }} />);
    expect(screen.queryByText('beginner')).not.toBeInTheDocument();
    expect(screen.queryByText('intermediate')).not.toBeInTheDocument();
    expect(screen.queryByText('advanced')).not.toBeInTheDocument();
  });

  it('should not render estimated time if null', () => {
    render(<PathCard path={{ ...basePath, estimatedMinutes: null }} />);
    expect(screen.queryByText('120m')).not.toBeInTheDocument();
  });
});
