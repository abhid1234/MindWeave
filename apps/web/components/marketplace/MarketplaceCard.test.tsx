import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarketplaceCard } from './MarketplaceCard';
import type { MarketplaceListingWithDetails } from '@/types/marketplace';

// Mock next/image
vi.mock('next/image', () => ({
  // eslint-disable-next-line jsx-a11y/alt-text
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

const mockListing: MarketplaceListingWithDetails = {
  id: 'listing-1',
  collectionId: 'col-1',
  category: 'programming',
  description: 'A great collection of programming resources',
  isFeatured: false,
  viewCount: 42,
  cloneCount: 7,
  publishedAt: new Date('2024-01-15'),
  collection: {
    name: 'React Patterns',
    color: '#3B82F6',
    description: 'Collection of React patterns',
  },
  creator: {
    id: 'user-1',
    name: 'John Doe',
    username: 'johndoe',
    image: 'https://example.com/avatar.jpg',
  },
  contentCount: 15,
  tags: ['react', 'javascript', 'typescript', 'frontend'],
};

describe('MarketplaceCard', () => {
  it('should render collection name', () => {
    render(<MarketplaceCard listing={mockListing} />);
    expect(screen.getByText('React Patterns')).toBeInTheDocument();
  });

  it('should render category badge', () => {
    render(<MarketplaceCard listing={mockListing} />);
    expect(screen.getByText('Programming')).toBeInTheDocument();
  });

  it('should render description', () => {
    render(<MarketplaceCard listing={mockListing} />);
    expect(screen.getByText('A great collection of programming resources')).toBeInTheDocument();
  });

  it('should render creator name', () => {
    render(<MarketplaceCard listing={mockListing} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render stats', () => {
    render(<MarketplaceCard listing={mockListing} />);
    expect(screen.getByText('15')).toBeInTheDocument(); // content count
    expect(screen.getByText('42')).toBeInTheDocument(); // views
    expect(screen.getByText('7')).toBeInTheDocument(); // clones
  });

  it('should render up to 3 tags', () => {
    render(<MarketplaceCard listing={mockListing} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('javascript')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('should link to listing detail page', () => {
    render(<MarketplaceCard listing={mockListing} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/marketplace/listing-1');
  });

  it('should render creator avatar', () => {
    render(<MarketplaceCard listing={mockListing} />);
    const avatar = screen.getByRole('img', { name: 'John Doe' });
    expect(avatar).toBeInTheDocument();
  });

  it('should render fallback initial when no image', () => {
    const listingNoImage = {
      ...mockListing,
      creator: { ...mockListing.creator, image: null },
    };
    render(<MarketplaceCard listing={listingNoImage} />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('should use collection description as fallback', () => {
    const listingNoDesc = { ...mockListing, description: null };
    render(<MarketplaceCard listing={listingNoDesc} />);
    expect(screen.getByText('Collection of React patterns')).toBeInTheDocument();
  });
});
