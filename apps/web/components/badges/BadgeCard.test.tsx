import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/test-utils';
import { BadgeCard } from './BadgeCard';
import type { UserBadgeWithDefinition, BadgeDefinition } from '@/types/badges';

const mockBadge: BadgeDefinition = {
  id: 'creator-1',
  name: 'First Step',
  description: 'Create your first piece of content',
  tier: 'bronze',
  category: 'creator',
  threshold: 1,
  triggers: ['content_created', 'manual_check'],
  icon: 'Sparkles',
};

describe('BadgeCard', () => {
  it('renders unlocked badge with name and description', () => {
    const data: UserBadgeWithDefinition = {
      badge: mockBadge,
      unlocked: true,
      unlockedAt: new Date('2024-01-01'),
      progress: 1,
    };
    render(<BadgeCard data={data} />);
    expect(screen.getByText('First Step')).toBeInTheDocument();
    expect(screen.getByText('Create your first piece of content')).toBeInTheDocument();
  });

  it('shows tier label', () => {
    const data: UserBadgeWithDefinition = {
      badge: mockBadge,
      unlocked: true,
      unlockedAt: new Date(),
      progress: 1,
    };
    render(<BadgeCard data={data} />);
    expect(screen.getByText('bronze')).toBeInTheDocument();
  });

  it('shows progress bar for locked badges', () => {
    const data: UserBadgeWithDefinition = {
      badge: { ...mockBadge, id: 'creator-10', threshold: 10 },
      unlocked: false,
      unlockedAt: null,
      progress: 7,
    };
    render(<BadgeCard data={data} />);
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('7 / 10')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('does not show progress bar for unlocked badges', () => {
    const data: UserBadgeWithDefinition = {
      badge: mockBadge,
      unlocked: true,
      unlockedAt: new Date(),
      progress: 1,
    };
    render(<BadgeCard data={data} />);
    expect(screen.queryByText('Progress')).not.toBeInTheDocument();
  });

  it('applies reduced opacity for locked badges', () => {
    const data: UserBadgeWithDefinition = {
      badge: mockBadge,
      unlocked: false,
      unlockedAt: null,
      progress: 0,
    };
    const { container } = render(<BadgeCard data={data} />);
    const card = container.querySelector('[data-testid="badge-card-creator-1"]');
    expect(card?.className).toContain('opacity-60');
  });

  it('renders gold tier with correct styling', () => {
    const goldBadge: BadgeDefinition = {
      ...mockBadge,
      id: 'creator-50',
      tier: 'gold',
    };
    const data: UserBadgeWithDefinition = {
      badge: goldBadge,
      unlocked: true,
      unlockedAt: new Date(),
      progress: 50,
    };
    render(<BadgeCard data={data} />);
    expect(screen.getByText('gold')).toBeInTheDocument();
  });
});
