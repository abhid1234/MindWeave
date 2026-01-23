'use server';

import { auth } from '@/lib/auth';
import { searchSimilarContent, getRecommendations } from '@/lib/ai/embeddings';
import type { ContentType } from '@/lib/db/schema';

export type SemanticSearchResult = {
  id: string;
  title: string;
  body: string | null;
  type: ContentType;
  tags: string[];
  autoTags: string[];
  url: string | null;
  createdAt: Date;
  similarity: number;
};

export type SemanticSearchResponse = {
  success: boolean;
  message?: string;
  results: SemanticSearchResult[];
};

export type RecommendationsResponse = {
  success: boolean;
  message?: string;
  recommendations: Array<{
    id: string;
    title: string;
    similarity: number;
  }>;
};

/**
 * Perform semantic search using vector similarity
 * Returns content ordered by relevance to the query
 */
export async function semanticSearchAction(
  query: string,
  limit: number = 10
): Promise<SemanticSearchResponse> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'Unauthorized. Please log in.',
        results: [],
      };
    }

    // Validate query
    if (!query || typeof query !== 'string') {
      return {
        success: false,
        message: 'Please enter a search query.',
        results: [],
      };
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      return {
        success: false,
        message: 'Please enter a search query.',
        results: [],
      };
    }

    if (trimmedQuery.length > 1000) {
      return {
        success: false,
        message: 'Query is too long. Please use fewer than 1000 characters.',
        results: [],
      };
    }

    // Validate limit
    const validLimit = Math.min(Math.max(1, limit), 50);

    // Perform semantic search
    const results = await searchSimilarContent(
      trimmedQuery,
      session.user.id,
      validLimit
    );

    return {
      success: true,
      results: results as SemanticSearchResult[],
    };
  } catch (error) {
    console.error('Error in semantic search:', error);
    return {
      success: false,
      message: 'Search failed. Please try again.',
      results: [],
    };
  }
}

/**
 * Get content recommendations based on a specific content item
 * Returns similar content ordered by relevance
 */
export async function getRecommendationsAction(
  contentId: string,
  limit: number = 5
): Promise<RecommendationsResponse> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'Unauthorized. Please log in.',
        recommendations: [],
      };
    }

    // Validate contentId
    if (!contentId || typeof contentId !== 'string') {
      return {
        success: false,
        message: 'Invalid content ID.',
        recommendations: [],
      };
    }

    // Validate limit
    const validLimit = Math.min(Math.max(1, limit), 20);

    // Get recommendations
    const recommendations = await getRecommendations(contentId, validLimit);

    return {
      success: true,
      recommendations,
    };
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return {
      success: false,
      message: 'Failed to get recommendations. Please try again.',
      recommendations: [],
    };
  }
}
