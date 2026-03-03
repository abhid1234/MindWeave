import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TilCard } from './TilCard';
import type { TilPostWithDetails } from '@/types/til';

// Mock next/image
vi.mock('next/image', () => ({
  // eslint-disable-next-line jsx-a11y/alt-text
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock upvote action
vi.mock('@/app/actions/til', () => ({
  upvoteTilAction: vi.fn().mockResolvedValue({ success: true }),
}));

const mockPost: TilPostWithDetails = {
  id: 'til-1',
  contentId: 'c-1',
  title: 'TIL: React Server Components',
  body: 'Server Components render on the server and send HTML to the client, reducing bundle size.',
  tags: ['react', 'nextjs', 'performance'],
  upvoteCount: 42,
  viewCount: 156,
  publishedAt: new Date(Date.now() - 3600000), // 1 hour ago
  creator: {
    id: 'u-1',
    name: 'Jane Doe',
    username: 'janedoe',
    image: 'https://example.com/avatar.jpg',
  },
  hasUpvoted: false,
  shareId: 'abc123',
};

describe('TilCard', () => {
  it('should render title', () => {
    render(<TilCard post={mockPost} isAuthenticated={false} />);
    expect(screen.getByText('TIL: React Server Components')).toBeInTheDocument();
  });

  it('should render body preview', () => {
    render(<TilCard post={mockPost} isAuthenticated={false} />);
    expect(screen.getByText(/Server Components render/)).toBeInTheDocument();
  });

  it('should render tags', () => {
    render(<TilCard post={mockPost} isAuthenticated={false} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('nextjs')).toBeInTheDocument();
  });

  it('should render creator name', () => {
    render(<TilCard post={mockPost} isAuthenticated={false} />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('should render upvote count', () => {
    render(<TilCard post={mockPost} isAuthenticated={false} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should render view count', () => {
    render(<TilCard post={mockPost} isAuthenticated={false} />);
    expect(screen.getByText('156')).toBeInTheDocument();
  });

  it('should link to TIL detail page', () => {
    render(<TilCard post={mockPost} isAuthenticated={false} />);
    const link = screen.getByRole('link', { name: /React Server Components/ });
    expect(link).toHaveAttribute('href', '/til/til-1');
  });

  it('should render relative time', () => {
    render(<TilCard post={mockPost} isAuthenticated={false} />);
    expect(screen.getByText('1h ago')).toBeInTheDocument();
  });
});
