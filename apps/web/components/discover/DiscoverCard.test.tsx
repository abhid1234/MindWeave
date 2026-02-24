import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiscoverCard } from './DiscoverCard';

const baseProps = {
  id: 'card-1',
  title: 'Test Card Title',
  body: 'This is the body of the card used for previewing content.',
  type: 'note' as const,
  tags: ['react', 'typescript'],
  autoTags: ['ai-tag'],
  similarity: 0.85,
  score: 0.75,
  lastViewedAt: null,
  createdAt: new Date('2025-06-10T12:00:00Z'),
};

describe('DiscoverCard', () => {
  it('should render title', () => {
    render(<DiscoverCard {...baseProps} />);

    expect(screen.getByText('Test Card Title')).toBeInTheDocument();
  });

  it('should render body preview', () => {
    render(<DiscoverCard {...baseProps} />);

    expect(screen.getByText(/This is the body/)).toBeInTheDocument();
  });

  it('should show "New to you" badge when never viewed', () => {
    render(<DiscoverCard {...baseProps} lastViewedAt={null} />);

    expect(screen.getByTestId('new-badge')).toBeInTheDocument();
    expect(screen.getByText('New to you')).toBeInTheDocument();
  });

  it('should not show "New to you" badge when previously viewed', () => {
    render(<DiscoverCard {...baseProps} lastViewedAt={new Date()} />);

    expect(screen.queryByTestId('new-badge')).not.toBeInTheDocument();
  });

  it('should display similarity percentage', () => {
    render(<DiscoverCard {...baseProps} similarity={0.92} />);

    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('should not show similarity when zero', () => {
    render(<DiscoverCard {...baseProps} similarity={0} />);

    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('should show up to 2 tags', () => {
    render(<DiscoverCard {...baseProps} />);

    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<DiscoverCard {...baseProps} onClick={onClick} />);

    await user.click(screen.getByTestId('discover-card-card-1'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should render without body', () => {
    render(<DiscoverCard {...baseProps} body={null} />);

    expect(screen.getByText('Test Card Title')).toBeInTheDocument();
  });

  it('should handle empty tags', () => {
    render(<DiscoverCard {...baseProps} tags={[]} autoTags={[]} />);

    expect(screen.getByText('Test Card Title')).toBeInTheDocument();
  });
});
