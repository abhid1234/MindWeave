import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db/client';
import { content } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface SearchSuggestion {
  text: string;
  type: 'recent' | 'popular' | 'related' | 'ai';
}

/**
 * Get popular tags for the user
 */
async function getPopularTags(userId: string, limit = 5): Promise<string[]> {
  const result = await db.execute<{ tag: string; tag_count: string }>(sql`
    SELECT tag, COUNT(*)::text as tag_count
    FROM (
      SELECT UNNEST(tags || auto_tags) as tag
      FROM ${content}
      WHERE user_id = ${userId}
    ) as all_tags
    WHERE tag IS NOT NULL AND tag != ''
    GROUP BY tag
    ORDER BY tag_count DESC
    LIMIT ${limit}
  `);

  const rows = result as unknown as { tag: string; tag_count: string }[];
  return rows.map((r) => r.tag);
}

/**
 * Generate AI-powered search suggestions based on query context
 */
async function generateAISuggestions(
  query: string,
  userTopics: string[]
): Promise<string[]> {
  if (!process.env.ANTHROPIC_API_KEY || query.length < 2) {
    return [];
  }

  try {
    const prompt = `Given a user searching "${query}" in their personal knowledge base about these topics: ${userTopics.join(', ')}

Suggest 3 related search queries they might want to try. Return only the suggestions, one per line, nothing else.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content[0];
    if (textContent.type === 'text') {
      return textContent.text
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.length < 50)
        .slice(0, 3);
    }
  } catch (error) {
    console.error('Error generating AI search suggestions:', error);
  }

  return [];
}

/**
 * Get search suggestions for the user based on their query and content
 */
export async function getSearchSuggestions(
  userId: string,
  query: string,
  recentSearches: string[] = []
): Promise<SearchSuggestion[]> {
  const suggestions: SearchSuggestion[] = [];

  try {
    // If no query, show popular tags and recent content
    if (!query || query.length < 2) {
      // Add popular tags as suggestions
      const popularTags = await getPopularTags(userId, 4);
      for (const tag of popularTags) {
        suggestions.push({
          text: tag,
          type: 'popular',
        });
      }

      // Add recent searches if available
      for (const search of recentSearches.slice(0, 3)) {
        suggestions.push({
          text: search,
          type: 'recent',
        });
      }

      return suggestions.slice(0, 6);
    }

    // Get user's topics for context
    const popularTags = await getPopularTags(userId, 10);

    // Filter tags that match the query
    const matchingTags = popularTags.filter((tag) =>
      tag.toLowerCase().includes(query.toLowerCase())
    );

    for (const tag of matchingTags.slice(0, 2)) {
      suggestions.push({
        text: tag,
        type: 'related',
      });
    }

    // Search for matching content titles
    const matchingContent = await db
      .select({ title: content.title })
      .from(content)
      .where(
        sql`${content.userId} = ${userId} AND ${content.title} ILIKE ${`%${query}%`}`
      )
      .limit(3);

    for (const item of matchingContent) {
      // Extract key words from matching titles
      const words = item.title.split(' ').filter((w) => w.length > 3);
      if (words.length > 0) {
        const suggestion = words.slice(0, 3).join(' ').toLowerCase();
        if (!suggestions.some((s) => s.text === suggestion)) {
          suggestions.push({
            text: suggestion,
            type: 'related',
          });
        }
      }
    }

    // Generate AI suggestions if we have enough context
    if (query.length >= 3 && popularTags.length >= 3) {
      const aiSuggestions = await generateAISuggestions(query, popularTags);
      for (const text of aiSuggestions) {
        if (!suggestions.some((s) => s.text.toLowerCase() === text.toLowerCase())) {
          suggestions.push({
            text,
            type: 'ai',
          });
        }
      }
    }

    // Add partial matches from recent searches
    for (const search of recentSearches) {
      if (
        search.toLowerCase().includes(query.toLowerCase()) &&
        !suggestions.some((s) => s.text === search)
      ) {
        suggestions.push({
          text: search,
          type: 'recent',
        });
      }
    }

    return suggestions.slice(0, 6);
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
}
