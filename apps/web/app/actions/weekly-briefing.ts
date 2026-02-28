'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content, generatedPosts } from '@/lib/db/schema';
import { eq, gte, and, desc } from 'drizzle-orm';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { generateWeeklyBriefing } from '@/lib/ai/gemini';

interface WeeklyBriefingResult {
  success: boolean;
  data?: {
    postContent: string;
    sourceContentTitles: string[];
    themes: string[];
  };
  message?: string;
}

/**
 * Generate a weekly briefing LinkedIn post from the user's recent content
 */
export async function generateWeeklyBriefingAction(): Promise<WeeklyBriefingResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const userId = session.user.id;

    // Rate limit
    const rateCheck = checkServerActionRateLimit(userId, 'weeklyBriefing', RATE_LIMITS.serverActionAI);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Fetch content from last 7 days
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekContent = await db
      .select({
        id: content.id,
        title: content.title,
        body: content.body,
        tags: content.tags,
        autoTags: content.autoTags,
      })
      .from(content)
      .where(and(eq(content.userId, userId), gte(content.createdAt, oneWeekAgo)))
      .orderBy(desc(content.createdAt))
      .limit(20);

    if (weekContent.length < 2) {
      return {
        success: false,
        message: 'You need at least 2 items from this week to generate a briefing. Keep capturing knowledge!',
      };
    }

    // Extract themes (top tags from the week)
    const tagCounts = new Map<string, number>();
    for (const item of weekContent) {
      for (const tag of [...item.tags, ...item.autoTags]) {
        const lower = tag.toLowerCase();
        tagCounts.set(lower, (tagCounts.get(lower) || 0) + 1);
      }
    }
    const themes = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // Generate the briefing post
    const postContent = await generateWeeklyBriefing(
      weekContent.map((c) => ({
        title: c.title,
        body: c.body || undefined,
        tags: [...c.tags, ...c.autoTags],
      })),
      themes
    );

    const sourceContentTitles = weekContent.map((c) => c.title);

    // Save to generatedPosts
    await db.insert(generatedPosts).values({
      userId,
      postContent,
      tone: 'weekly-briefing',
      length: 'medium',
      includeHashtags: true,
      sourceContentIds: weekContent.map((c) => c.id),
      sourceContentTitles,
    });

    return {
      success: true,
      data: {
        postContent,
        sourceContentTitles,
        themes,
      },
    };
  } catch (error) {
    console.error('Error generating weekly briefing:', error);
    return { success: false, message: 'Failed to generate weekly briefing' };
  }
}

/**
 * Get the latest weekly briefing for the current user
 */
export async function getLatestBriefingAction(): Promise<WeeklyBriefingResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const userId = session.user.id;
    const result = await db.query.generatedPosts.findFirst({
      where: (gp, { eq, and }) =>
        and(eq(gp.userId, userId), eq(gp.tone, 'weekly-briefing')),
      orderBy: (gp, { desc }) => [desc(gp.createdAt)],
    });

    if (!result) {
      return { success: true }; // No briefing yet
    }

    return {
      success: true,
      data: {
        postContent: result.postContent,
        sourceContentTitles: result.sourceContentTitles,
        themes: [],
      },
    };
  } catch (error) {
    console.error('Error fetching latest briefing:', error);
    return { success: false, message: 'Failed to load briefing' };
  }
}
