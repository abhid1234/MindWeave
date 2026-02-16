import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db/client';
import { content } from '@/lib/db/schema';
import { eq, desc, count, sql } from 'drizzle-orm';

const genAI = process.env.GOOGLE_AI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  : null;

export type InsightType = 'connection' | 'pattern' | 'gap' | 'suggestion';

export interface KeyInsight {
  type: InsightType;
  title: string;
  description: string;
  relatedContentIds: string[];
  confidence: number; // 0-1 score
  icon: string;
}

interface ContentSummary {
  id: string;
  title: string;
  type: string;
  tags: string[];
  autoTags: string[];
  createdAt: Date;
}

/**
 * Analyze tag co-occurrence patterns
 */
async function analyzeTagPatterns(userId: string): Promise<KeyInsight[]> {
  const insights: KeyInsight[] = [];

  // Get tag co-occurrence data
  const result = await db.execute<{ tag1: string; tag2: string; co_count: string }>(sql`
    WITH tag_pairs AS (
      SELECT
        t1.tag as tag1,
        t2.tag as tag2,
        c.id as content_id
      FROM ${content} c,
        UNNEST(c.tags || c.auto_tags) as t1(tag),
        UNNEST(c.tags || c.auto_tags) as t2(tag)
      WHERE c.user_id = ${userId}
        AND t1.tag < t2.tag
        AND t1.tag IS NOT NULL
        AND t2.tag IS NOT NULL
        AND t1.tag != ''
        AND t2.tag != ''
    )
    SELECT tag1, tag2, COUNT(DISTINCT content_id)::text as co_count
    FROM tag_pairs
    GROUP BY tag1, tag2
    HAVING COUNT(DISTINCT content_id) >= 3
    ORDER BY co_count DESC
    LIMIT 5
  `);

  const rows = result as unknown as { tag1: string; tag2: string; co_count: string }[];

  if (rows.length > 0) {
    const topPair = rows[0];
    insights.push({
      type: 'connection',
      title: 'Topic Connection',
      description: `"${topPair.tag1}" and "${topPair.tag2}" frequently appear together (${topPair.co_count} items). Consider creating a dedicated collection for this intersection.`,
      relatedContentIds: [],
      confidence: 0.8,
      icon: 'link',
    });
  }

  return insights;
}

/**
 * Analyze content creation patterns
 */
async function analyzeCreationPatterns(userId: string): Promise<KeyInsight[]> {
  const insights: KeyInsight[] = [];

  // Get content creation by day of week
  const weekdayResult = await db.execute<{ weekday: string; item_count: string }>(sql`
    SELECT
      TO_CHAR(created_at, 'Day') as weekday,
      COUNT(*)::text as item_count
    FROM ${content}
    WHERE user_id = ${userId}
      AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY TO_CHAR(created_at, 'Day'), EXTRACT(DOW FROM created_at)
    ORDER BY EXTRACT(DOW FROM created_at)
  `);

  const weekdays = weekdayResult as unknown as { weekday: string; item_count: string }[];

  if (weekdays.length > 0) {
    let maxDay = weekdays[0];
    let minDay = weekdays[0];

    for (const day of weekdays) {
      if (parseInt(day.item_count) > parseInt(maxDay.item_count)) {
        maxDay = day;
      }
      if (parseInt(day.item_count) < parseInt(minDay.item_count)) {
        minDay = day;
      }
    }

    if (parseInt(maxDay.item_count) >= 3) {
      insights.push({
        type: 'pattern',
        title: 'Peak Activity Day',
        description: `You're most active on ${maxDay.weekday.trim()}s with ${maxDay.item_count} items added this month. That's when you capture the most knowledge!`,
        relatedContentIds: [],
        confidence: 0.7,
        icon: 'calendar',
      });
    }
  }

  // Get content type distribution
  const typeResult = await db
    .select({
      type: content.type,
      count: count(),
    })
    .from(content)
    .where(eq(content.userId, userId))
    .groupBy(content.type);

  if (typeResult.length > 1) {
    const total = typeResult.reduce((sum, r) => sum + r.count, 0);
    const dominant = typeResult.reduce((max, r) => (r.count > max.count ? r : max), typeResult[0]);
    const percentage = Math.round((dominant.count / total) * 100);

    if (percentage >= 60) {
      const typeName = dominant.type === 'note' ? 'notes' : dominant.type === 'link' ? 'links' : 'files';
      insights.push({
        type: 'pattern',
        title: 'Content Preference',
        description: `${percentage}% of your knowledge base is ${typeName}. Consider diversifying with other content types for a richer knowledge base.`,
        relatedContentIds: [],
        confidence: 0.6,
        icon: 'pie-chart',
      });
    }
  }

  return insights;
}

/**
 * Identify knowledge gaps
 */
async function identifyGaps(userId: string): Promise<KeyInsight[]> {
  const insights: KeyInsight[] = [];

  // Find tags that appeared recently but have low item counts
  const recentTagsResult = await db.execute<{ tag: string; recent_count: string; total_count: string }>(sql`
    WITH recent_tags AS (
      SELECT UNNEST(tags || auto_tags) as tag
      FROM ${content}
      WHERE user_id = ${userId}
        AND created_at >= NOW() - INTERVAL '14 days'
    ),
    all_tags AS (
      SELECT UNNEST(tags || auto_tags) as tag
      FROM ${content}
      WHERE user_id = ${userId}
    )
    SELECT
      r.tag,
      COUNT(DISTINCT r.tag)::text as recent_count,
      (SELECT COUNT(*) FROM all_tags a WHERE a.tag = r.tag)::text as total_count
    FROM recent_tags r
    WHERE r.tag IS NOT NULL AND r.tag != ''
    GROUP BY r.tag
    HAVING COUNT(*) >= 2
    ORDER BY COUNT(*) DESC
    LIMIT 5
  `);

  const recentTags = recentTagsResult as unknown as { tag: string; recent_count: string; total_count: string }[];

  // Find emerging topics
  for (const tag of recentTags) {
    if (parseInt(tag.total_count) <= 3 && parseInt(tag.recent_count) >= 2) {
      insights.push({
        type: 'gap',
        title: 'Emerging Topic',
        description: `"${tag.tag}" is a new area of interest. You've added ${tag.total_count} items recently. Consider exploring this topic further!`,
        relatedContentIds: [],
        confidence: 0.6,
        icon: 'trending-up',
      });
      break; // Only show one emerging topic
    }
  }

  return insights;
}

/**
 * Generate AI-powered suggestions
 */
async function generateAISuggestions(
  userId: string,
  contentSummaries: ContentSummary[]
): Promise<KeyInsight[]> {
  if (!genAI || contentSummaries.length < 5) {
    return [];
  }

  try {
    const allTags = [...new Set(
      contentSummaries.flatMap((c) => [...c.tags, ...c.autoTags])
    )].slice(0, 20);

    const recentTitles = contentSummaries.slice(0, 10).map((c) => c.title);

    const prompt = `Analyze this user's knowledge base and suggest ONE actionable insight:

Recent content titles: ${recentTitles.join(', ')}
All topics: ${allTags.join(', ')}
Total items: ${contentSummaries.length}

Suggest a brief, actionable insight about:
- Connections they might be missing
- Topics they could explore more deeply
- Ways to organize their knowledge better

Respond in JSON: {"title": "short title", "description": "1-2 sentence actionable suggestion"}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (text) {
      try {
        // Strip markdown code fences if present (e.g. ```json ... ```)
        const cleaned = text
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```\s*$/, '')
          .trim();
        const parsed = JSON.parse(cleaned);
        return [
          {
            type: 'suggestion' as InsightType,
            title: parsed.title || 'AI Suggestion',
            description: parsed.description || text,
            relatedContentIds: [],
            confidence: 0.7,
            icon: 'lightbulb',
          },
        ];
      } catch {
        return [
          {
            type: 'suggestion' as InsightType,
            title: 'AI Insight',
            description: text.slice(0, 200),
            relatedContentIds: [],
            confidence: 0.6,
            icon: 'lightbulb',
          },
        ];
      }
    }
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
  }

  return [];
}

/**
 * Extract key insights from user's knowledge base
 */
export async function extractInsights(userId: string): Promise<KeyInsight[]> {
  try {
    // Fetch content summaries
    const contentSummaries = await db
      .select({
        id: content.id,
        title: content.title,
        type: content.type,
        tags: content.tags,
        autoTags: content.autoTags,
        createdAt: content.createdAt,
      })
      .from(content)
      .where(eq(content.userId, userId))
      .orderBy(desc(content.createdAt))
      .limit(100);

    if (contentSummaries.length < 3) {
      return [
        {
          type: 'suggestion',
          title: 'Getting Started',
          description: 'Add more content to unlock personalized insights about your knowledge base.',
          relatedContentIds: [],
          confidence: 1,
          icon: 'zap',
        },
      ];
    }

    // Run all analyses in parallel
    const [tagPatterns, creationPatterns, gaps, aiSuggestions] = await Promise.all([
      analyzeTagPatterns(userId),
      analyzeCreationPatterns(userId),
      identifyGaps(userId),
      generateAISuggestions(userId, contentSummaries),
    ]);

    // Combine and sort by confidence
    const allInsights = [
      ...tagPatterns,
      ...creationPatterns,
      ...gaps,
      ...aiSuggestions,
    ];

    // Sort by confidence and return top 5
    allInsights.sort((a, b) => b.confidence - a.confidence);
    return allInsights.slice(0, 5);
  } catch (error) {
    console.error('Error extracting insights:', error);
    return [];
  }
}
