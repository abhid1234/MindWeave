/**
 * Types for Knowledge Marketplace feature
 */

import type { MarketplaceCategory } from '@/lib/db/schema';

export interface MarketplaceListingWithDetails {
  id: string;
  collectionId: string;
  category: MarketplaceCategory;
  description: string | null;
  isFeatured: boolean;
  viewCount: number;
  cloneCount: number;
  publishedAt: Date;
  collection: {
    name: string;
    color: string | null;
    description: string | null;
  };
  creator: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  contentCount: number;
  tags: string[];
}

export interface MarketplaceCreatorStats {
  totalListings: number;
  totalViews: number;
  totalClones: number;
}

export interface MarketplaceListingDetail extends MarketplaceListingWithDetails {
  contentPreview: {
    id: string;
    title: string;
    type: string;
  }[];
}

export type MarketplaceSortOption = 'trending' | 'newest' | 'most-cloned';

export interface BrowseMarketplaceParams {
  query?: string;
  category?: MarketplaceCategory;
  sort?: MarketplaceSortOption;
  page?: number;
  perPage?: number;
}

export interface BrowseMarketplaceResult {
  success: boolean;
  listings: MarketplaceListingWithDetails[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface MarketplaceActionResult {
  success: boolean;
  message: string;
}

export interface CloneResult extends MarketplaceActionResult {
  collectionId?: string;
}

export interface MarketplaceStatsResult {
  success: boolean;
  stats?: MarketplaceCreatorStats;
  listings?: {
    id: string;
    collectionName: string;
    viewCount: number;
    cloneCount: number;
  }[];
  message?: string;
}

export interface GetMarketplaceListingResult {
  success: boolean;
  listing?: MarketplaceListingDetail;
  message?: string;
}
