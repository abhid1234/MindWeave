import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content } from '@/lib/db/schema';
import { eq, desc, sql, gte, and } from 'drizzle-orm';
import Link from 'next/link';
import { formatDateUTC } from '@/lib/utils';
import { DashboardRecommendations } from '@/components/dashboard/DashboardRecommendations';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DailyHighlight } from '@/components/dashboard/DailyHighlight';
import { DashboardReminders } from '@/components/dashboard/DashboardReminders';
import { Zap, Search, Library, ArrowRight, LayoutDashboard, PenLine } from 'lucide-react';

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

  const quickActions = [
    {
      href: '/dashboard/capture',
      label: 'Quick Capture',
      description: 'Save a note, link, or file',
      icon: Zap,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
      borderHover: 'hover:border-amber-500/30',
    },
    {
      href: '/dashboard/search',
      label: 'Search',
      description: 'Find anything in your knowledge base',
      icon: Search,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
      borderHover: 'hover:border-blue-500/30',
    },
    {
      href: '/dashboard/library',
      label: 'Browse Library',
      description: 'Explore all your content',
      icon: Library,
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-600',
      borderHover: 'hover:border-green-500/30',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 animate-fade-up" style={{ animationFillMode: 'backwards' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {session.user?.name?.split(' ')[0]}!</h1>
            <p className="text-muted-foreground">
              Here&apos;s what&apos;s happening with your knowledge hub
            </p>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Left column - Stats */}
        <div className="animate-fade-up" style={{ animationFillMode: 'backwards' }}>
          <DashboardStats totalCount={totalCount} tagCount={tagCount} thisWeekCount={thisWeekCount} favoritesCount={favoritesCount} />
        </div>

        {/* Right column - Daily Highlight + Quick Actions */}
        <div className="flex flex-col gap-3">
          <DailyHighlight />
          {quickActions.map((action, i) => (
            <Link
              key={action.href}
              href={action.href}
              className={`group flex items-center gap-4 rounded-xl border bg-card p-4 transition-all duration-200 animate-fade-up hover:shadow-soft-md hover:-translate-y-0.5 ${action.borderHover}`}
              style={{ animationDelay: `${(i + 1) * 75}ms`, animationFillMode: 'backwards' }}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.iconBg}`}>
                <action.icon className={`h-5 w-5 ${action.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold">{action.label}</h3>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>

        {/* Recent Items - spans full left column */}
        <div
          className="animate-fade-up"
          style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Items</h2>
            <Link href="/dashboard/library" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>

          {latestItems.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center shadow-soft">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <PenLine className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">No content yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Start capturing your ideas!</p>
              <Link
                href="/dashboard/capture"
                className="mt-4 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Create Your First Note
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {latestItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/dashboard/library?highlight=${item.id}`}
                  className="block rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-soft-md hover:-translate-y-0.5"
                >
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
      </div>

      {/* Reminders */}
      <DashboardReminders />

      {/* Recommendations - full width */}
      <DashboardRecommendations />
    </div>
  );
}
