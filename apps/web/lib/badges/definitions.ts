import type {
  BadgeDefinition,
  BadgeCategoryMeta,
  BadgeTrigger,
} from '@/types/badges';

export const BADGE_CATEGORIES: BadgeCategoryMeta[] = [
  {
    id: 'creator',
    name: 'Creator',
    description: 'Content creation milestones',
  },
  {
    id: 'streak',
    name: 'Streak',
    description: 'Consistency and daily habits',
  },
  {
    id: 'sharer',
    name: 'Sharer',
    description: 'Sharing knowledge via TIL',
  },
  {
    id: 'curator',
    name: 'Curator',
    description: 'Organizing knowledge into collections',
  },
  {
    id: 'community',
    name: 'Community',
    description: 'Marketplace contributions',
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Diverse engagement patterns',
  },
  {
    id: 'scholar',
    name: 'Scholar',
    description: 'Flashcard study achievements',
  },
];

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Creator badges
  {
    id: 'creator-1',
    name: 'First Step',
    description: 'Create your first piece of content',
    tier: 'bronze',
    category: 'creator',
    threshold: 1,
    triggers: ['content_created', 'manual_check'],
    icon: 'Sparkles',
  },
  {
    id: 'creator-10',
    name: 'Builder',
    description: 'Create 10 pieces of content',
    tier: 'silver',
    category: 'creator',
    threshold: 10,
    triggers: ['content_created', 'manual_check'],
    icon: 'Hammer',
  },
  {
    id: 'creator-50',
    name: 'Prolific',
    description: 'Create 50 pieces of content',
    tier: 'gold',
    category: 'creator',
    threshold: 50,
    triggers: ['content_created', 'manual_check'],
    icon: 'Flame',
  },
  {
    id: 'creator-100',
    name: 'Centurion',
    description: 'Create 100 pieces of content',
    tier: 'gold',
    category: 'creator',
    threshold: 100,
    triggers: ['content_created', 'manual_check'],
    icon: 'Crown',
  },
  {
    id: 'creator-500',
    name: 'Archivist',
    description: 'Create 500 pieces of content',
    tier: 'gold',
    category: 'creator',
    threshold: 500,
    triggers: ['content_created', 'manual_check'],
    icon: 'BookOpen',
  },

  // Streak badges
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    tier: 'bronze',
    category: 'streak',
    threshold: 7,
    triggers: ['content_created', 'manual_check'],
    icon: 'Zap',
  },
  {
    id: 'streak-30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    tier: 'silver',
    category: 'streak',
    threshold: 30,
    triggers: ['content_created', 'manual_check'],
    icon: 'Calendar',
  },
  {
    id: 'streak-100',
    name: 'Unstoppable',
    description: 'Maintain a 100-day streak',
    tier: 'gold',
    category: 'streak',
    threshold: 100,
    triggers: ['content_created', 'manual_check'],
    icon: 'Rocket',
  },

  // Sharer badges
  {
    id: 'sharer-1',
    name: 'First TIL',
    description: 'Publish your first TIL post',
    tier: 'bronze',
    category: 'sharer',
    threshold: 1,
    triggers: ['til_published', 'manual_check'],
    icon: 'Share2',
  },
  {
    id: 'sharer-5',
    name: 'Thought Leader',
    description: 'Publish 5 TIL posts',
    tier: 'silver',
    category: 'sharer',
    threshold: 5,
    triggers: ['til_published', 'manual_check'],
    icon: 'Megaphone',
  },
  {
    id: 'sharer-viral',
    name: 'Viral',
    description: 'Get 50 upvotes on a single TIL post',
    tier: 'gold',
    category: 'sharer',
    threshold: 50,
    triggers: ['upvote_received', 'manual_check'],
    icon: 'TrendingUp',
  },

  // Curator badges
  {
    id: 'curator-1',
    name: 'Organizer',
    description: 'Create your first collection',
    tier: 'bronze',
    category: 'curator',
    threshold: 1,
    triggers: ['collection_created', 'manual_check'],
    icon: 'FolderPlus',
  },
  {
    id: 'curator-5',
    name: 'Curator',
    description: 'Create 5 collections',
    tier: 'silver',
    category: 'curator',
    threshold: 5,
    triggers: ['collection_created', 'manual_check'],
    icon: 'Folders',
  },
  {
    id: 'curator-mega',
    name: 'Mega Collection',
    description: 'Have a collection with 50+ items',
    tier: 'gold',
    category: 'curator',
    threshold: 50,
    triggers: ['content_created', 'manual_check'],
    icon: 'Library',
  },

  // Community badges
  {
    id: 'community-published',
    name: 'Published',
    description: 'Publish a collection to the marketplace',
    tier: 'bronze',
    category: 'community',
    threshold: 1,
    triggers: ['marketplace_published', 'manual_check'],
    icon: 'Globe',
  },
  {
    id: 'community-popular',
    name: 'Popular',
    description: 'Get 10 clones on a marketplace listing',
    tier: 'silver',
    category: 'community',
    threshold: 10,
    triggers: ['clone_received', 'manual_check'],
    icon: 'Heart',
  },
  {
    id: 'community-influencer',
    name: 'Influencer',
    description: 'Get 100 total clones across all listings',
    tier: 'gold',
    category: 'community',
    threshold: 100,
    triggers: ['clone_received', 'manual_check'],
    icon: 'Star',
  },

  // Explorer badges
  {
    id: 'explorer-diverse',
    name: 'Diverse Learner',
    description: 'Create content of 3 different types',
    tier: 'bronze',
    category: 'explorer',
    threshold: 3,
    triggers: ['content_created', 'manual_check'],
    icon: 'Palette',
  },
  {
    id: 'explorer-tags',
    name: 'Tag Master',
    description: 'Use 20 distinct tags across your content',
    tier: 'silver',
    category: 'explorer',
    threshold: 20,
    triggers: ['content_created', 'manual_check'],
    icon: 'Tags',
  },
  {
    id: 'explorer-views',
    name: 'Deep Diver',
    description: 'View 100 pieces of content',
    tier: 'gold',
    category: 'explorer',
    threshold: 100,
    triggers: ['content_created', 'manual_check'],
    icon: 'Eye',
  },

  // Scholar badges
  {
    id: 'scholar-first',
    name: 'First Flash',
    description: 'Review your first flashcard',
    tier: 'bronze',
    category: 'scholar',
    threshold: 1,
    triggers: ['flashcard_reviewed', 'manual_check'],
    icon: 'Brain',
  },
  {
    id: 'scholar-50',
    name: 'Dedicated Student',
    description: 'Review 50 flashcards',
    tier: 'silver',
    category: 'scholar',
    threshold: 50,
    triggers: ['flashcard_reviewed', 'manual_check'],
    icon: 'GraduationCap',
  },
  {
    id: 'scholar-streak',
    name: 'Study Streak',
    description: 'Study flashcards 7 days in a row',
    tier: 'gold',
    category: 'scholar',
    threshold: 7,
    triggers: ['flashcard_reviewed', 'manual_check'],
    icon: 'BookMarked',
  },
];

export function getBadgesByTrigger(trigger: BadgeTrigger): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter((b) => b.triggers.includes(trigger));
}

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((b) => b.id === id);
}
