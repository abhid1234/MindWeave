export type BadgeTier = 'bronze' | 'silver' | 'gold';

export type BadgeCategory =
  | 'creator'
  | 'streak'
  | 'sharer'
  | 'curator'
  | 'community'
  | 'explorer'
  | 'scholar'
  | 'pathfinder'
  | 'alchemist'
  | 'reviewer'
  | 'referrer';

export type BadgeTrigger =
  | 'content_created'
  | 'til_published'
  | 'upvote_received'
  | 'collection_created'
  | 'marketplace_published'
  | 'clone_received'
  | 'flashcard_reviewed'
  | 'path_created'
  | 'path_completed'
  | 'brain_dump_processed'
  | 'review_completed'
  | 'referral_activated'
  | 'manual_check';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  tier: BadgeTier;
  category: BadgeCategory;
  threshold: number;
  triggers: BadgeTrigger[];
  icon: string;
}

export interface BadgeCategoryMeta {
  id: BadgeCategory;
  name: string;
  description: string;
}

export interface UserBadgeWithDefinition {
  badge: BadgeDefinition;
  unlocked: boolean;
  unlockedAt: Date | null;
  progress: number;
}

export interface BadgeCheckResult {
  newlyUnlocked: string[];
}

export interface BadgesActionResult {
  success: boolean;
  data?: UserBadgeWithDefinition[];
  message?: string;
}

export interface PublicBadgesResult {
  success: boolean;
  data?: { badge: BadgeDefinition; unlockedAt: Date }[];
  message?: string;
}
