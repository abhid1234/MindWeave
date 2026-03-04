import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/test-utils';
import { BadgeGrid } from './BadgeGrid';
import { BADGE_DEFINITIONS, BADGE_CATEGORIES } from '@/lib/badges/definitions';
import type { UserBadgeWithDefinition } from '@/types/badges';

function makeBadgeData(overrides: Partial<UserBadgeWithDefinition> = {}): UserBadgeWithDefinition[] {
  return BADGE_DEFINITIONS.map((badge) => ({
    badge,
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    ...overrides,
  }));
}

describe('BadgeGrid', () => {
  it('renders all 6 categories', () => {
    render(<BadgeGrid badges={makeBadgeData()} />);
    for (const category of BADGE_CATEGORIES) {
      expect(screen.getByTestId(`badge-category-${category.id}`)).toBeInTheDocument();
    }
  });

  it('shows category names and descriptions', () => {
    render(<BadgeGrid badges={makeBadgeData()} />);
    expect(screen.getByText('Creator')).toBeInTheDocument();
    expect(screen.getByText('Content creation milestones')).toBeInTheDocument();
  });

  it('displays unlock counts per category', () => {
    const badges = makeBadgeData();
    // Unlock the first creator badge
    const creatorIdx = badges.findIndex((b) => b.badge.id === 'creator-1');
    badges[creatorIdx] = { ...badges[creatorIdx], unlocked: true, unlockedAt: new Date() };

    render(<BadgeGrid badges={badges} />);
    // Creator category should show "1 / 5"
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
  });

  it('renders all 18 badge cards', () => {
    render(<BadgeGrid badges={makeBadgeData()} />);
    for (const badge of BADGE_DEFINITIONS) {
      expect(screen.getByTestId(`badge-card-${badge.id}`)).toBeInTheDocument();
    }
  });
});
