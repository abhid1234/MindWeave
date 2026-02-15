import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content } from '@/lib/db/schema';
import { eq, desc, sql, gte, and } from 'drizzle-orm';
import Link from 'next/link';
import { formatDateUTC } from '@/lib/utils';
import { DashboardRecommendations } from '@/components/dashboard/DashboardRecommendations';
import { DashboardStats } from '@/components/dashboard/DashboardStats';

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  // Get recent content count
  const recentContent = await db
    .select({ count: sql<number>`count(*)` })
    .from(content)
    .where(eq(content.userId, userId));

  const totalCount = Number(recentContent[0]?.count || 0);

  // Get unique tags count
  const tagsResult = await db.execute<{ tag_count: string }>(sql`
    SELECT COUNT(DISTINCT tag) as tag_count
    FROM (
      SELECT UNNEST(tags || auto_tags) as tag
      FROM ${content}
      WHERE user_id = ${userId}
    ) as all_tags
    WHERE tag IS NOT NULL AND tag != ''
  `);
  const tagCount = parseInt((tagsResult as unknown as { tag_count: string }[])[0]?.tag_count || '0', 10);

  // Get items created this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const [thisWeekResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(content)
    .where(and(eq(content.userId, userId), gte(content.createdAt, oneWeekAgo)));
  const thisWeekCount = Number(thisWeekResult?.count || 0);

  // Get favorites count
  const [favoritesResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(content)
    .where(and(eq(content.userId, userId), eq(content.isFavorite, true)));
  const favoritesCount = Number(favoritesResult?.count || 0);

  // Get latest items
  const latestItems = await db
    .select()
    .from(content)
    .where(eq(content.userId, userId))
    .orderBy(desc(content.createdAt))
    .limit(5);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {session.user?.name?.split(' ')[0]}!</h1>
        <p className="mt-2 text-muted-foreground">
          Here&apos;s what&apos;s happening with your knowledge hub
        </p>
      </div>

      {/* Stats */}
      <DashboardStats totalCount={totalCount} tagCount={tagCount} thisWeekCount={thisWeekCount} favoritesCount={favoritesCount} />

      {/* Recent Items */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Items</h2>
          <Link href="/dashboard/library" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>

        {latestItems.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">No content yet. Start capturing your ideas!</p>
            <Link
              href="/dashboard/capture"
              className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create Your First Note
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {latestItems.map((item) => (
              <Link key={item.id} href={`/dashboard/library?highlight=${item.id}`} className="block rounded-lg border bg-card p-4 transition-colors hover:bg-accent">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{item.title.split(/\s+/).slice(0, 10).join(' ')}{item.title.split(/\s+/).length > 10 ? '...' : ''}</h3>
                    {item.body && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {item.body}
                      </p>
                    )}
                    {(item.tags?.length ?? 0) > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(item.tags ?? []).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-secondary px-2 py-1 text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDateUTC(item.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <DashboardRecommendations />

      {/* Quick Actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/dashboard/capture"
          className="rounded-lg border bg-card p-6 hover:bg-accent"
        >
          <h3 className="font-semibold">Quick Capture</h3>
          <p className="mt-2 text-sm text-muted-foreground">Save a note, link, or file</p>
        </Link>
        <Link
          href="/dashboard/search"
          className="rounded-lg border bg-card p-6 hover:bg-accent"
        >
          <h3 className="font-semibold">Search</h3>
          <p className="mt-2 text-sm text-muted-foreground">Find anything in your knowledge base</p>
        </Link>
        <Link
          href="/dashboard/library"
          className="rounded-lg border bg-card p-6 hover:bg-accent"
        >
          <h3 className="font-semibold">Browse Library</h3>
          <p className="mt-2 text-sm text-muted-foreground">Explore all your content</p>
        </Link>
      </div>
    </div>
  );
}
