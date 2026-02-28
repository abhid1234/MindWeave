/**
 * Types for Knowledge Wrapped feature
 */

export interface WrappedStats {
  totalItems: number;
  topTags: string[];
  longestStreak: number;
  currentStreak: number;
  mostActiveDay: string;
  contentTypeSplit: {
    notes: number;
    links: number;
    files: number;
  };
  monthOverMonthGrowth: number;
  mostConnectedContent: {
    id: string;
    title: string;
    connectionCount: number;
  } | null;
  knowledgePersonality: string;
  personalityDescription: string;
  totalActiveDays: number;
  uniqueTagCount: number;
}

export interface WrappedActionResult {
  success: boolean;
  data?: {
    shareId: string;
    stats: WrappedStats;
  };
  message?: string;
}

export interface WrappedPublicResult {
  success: boolean;
  data?: {
    stats: WrappedStats;
    createdAt: string;
    period: string;
  };
  message?: string;
}

export type WrappedCardVariant = 'overview' | 'top-tags' | 'streak' | 'personality';
