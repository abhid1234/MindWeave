import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { content, generatedPosts } from '@/lib/db/schema';
import { eq, gte, and, desc } from 'drizzle-orm';
import { generateWeeklyBriefing } from '@/lib/ai/gemini';

/**
 * Sunday cron endpoint: auto-generate weekly briefings for opted-in users
 * Protected by CRON_SECRET header
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find users with digest enabled (opted-in to weekly)
    const optedInUsers = await db.query.digestSettings.findMany({
      where: (ds, { eq }) => eq(ds.enabled, true),
    });

    let generated = 0;
    let skipped = 0;

    for (const settings of optedInUsers) {
      try {
        const userId = settings.userId;
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Fetch week's content
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
          skipped++;
          continue;
        }

        // Extract themes
        const tagCounts = new Map<string, number>();
        for (const item of weekContent) {
          for (const tag of [...item.tags, ...item.autoTags]) {
            tagCounts.set(tag.toLowerCase(), (tagCounts.get(tag.toLowerCase()) || 0) + 1);
          }
        }
        const themes = Array.from(tagCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag]) => tag);

        // Generate briefing
        const postContent = await generateWeeklyBriefing(
          weekContent.map((c) => ({
            title: c.title,
            body: c.body || undefined,
            tags: [...c.tags, ...c.autoTags],
          })),
          themes
        );

        // Save
        await db.insert(generatedPosts).values({
          userId,
          postContent,
          tone: 'weekly-briefing',
          length: 'medium',
          includeHashtags: true,
          sourceContentIds: weekContent.map((c) => c.id),
          sourceContentTitles: weekContent.map((c) => c.title),
        });

        generated++;
      } catch (error) {
        console.error(`Error generating briefing for user ${settings.userId}:`, error);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      generated,
      skipped,
      total: optedInUsers.length,
    });
  } catch (error) {
    console.error('Error in weekly briefing cron:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
