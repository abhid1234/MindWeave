'use server';

import { auth } from '@/lib/auth';
import {
  getSearchSuggestions,
  type SearchSuggestion,
} from '@/lib/ai/search-suggestions';

export type SearchSuggestionsResult = {
  success: boolean;
  suggestions: SearchSuggestion[];
  message?: string;
};

/**
 * Get search suggestions for the current user
 */
export async function getSearchSuggestionsAction(
  query: string,
  recentSearches: string[] = []
): Promise<SearchSuggestionsResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, suggestions: [], message: 'Unauthorized' };
    }

    const suggestions = await getSearchSuggestions(
      session.user.id,
      query,
      recentSearches
    );

    return { success: true, suggestions };
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return {
      success: false,
      suggestions: [],
      message: 'Failed to get suggestions',
    };
  }
}
