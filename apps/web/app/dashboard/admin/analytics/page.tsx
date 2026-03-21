import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);

interface DailyPageview {
  date: string;
  count: number;
}

interface TopPage {
  page: string;
  count: number;
}

interface TopReferrer {
  referrer: string;
  count: number;
}

interface FunnelStat {
  event: string;
  count: number;
}

export default async function AdminAnalyticsPage() {
  const session = await auth();

  if (!session?.user?.id || !session.user.email || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect('/dashboard');
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [dailyPageviews, topPages, topReferrers, funnelStats] = await Promise.all([
    // Daily pageviews for past 7 days
    db.execute(sql`
      SELECT
        DATE(created_at)::text AS date,
        COUNT(*)::int AS count
      FROM analytics_events
      WHERE event = 'page_view'
        AND created_at >= ${sevenDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `),
    // Top 10 pages by views
    db.execute(sql`
      SELECT
        page,
        COUNT(*)::int AS count
      FROM analytics_events
      WHERE event = 'page_view'
      GROUP BY page
      ORDER BY count DESC
      LIMIT 10
    `),
    // Top referral sources
    db.execute(sql`
      SELECT
        COALESCE(NULLIF(referrer, ''), '(direct)') AS referrer,
        COUNT(*)::int AS count
      FROM analytics_events
      WHERE event = 'page_view'
      GROUP BY referrer
      ORDER BY count DESC
      LIMIT 10
    `),
    // Signup funnel stats
    db.execute(sql`
      SELECT
        event,
        COUNT(*)::int AS count
      FROM analytics_events
      WHERE event IN ('page_view', 'cta_click', 'signup_complete')
      GROUP BY event
      ORDER BY count DESC
    `),
  ]);

  const dailyRows = dailyPageviews as unknown as DailyPageview[];
  const topPagesRows = topPages as unknown as TopPage[];
  const topReferrersRows = topReferrers as unknown as TopReferrer[];
  const funnelRows = funnelStats as unknown as FunnelStat[];

  const maxDailyCount = dailyRows.length > 0 ? Math.max(...dailyRows.map((r) => r.count)) : 1;

  // Build a map of funnel events for easy lookup
  const funnelMap: Record<string, number> = {};
  for (const row of funnelRows) {
    funnelMap[row.event] = row.count;
  }

  const pageViews = funnelMap['page_view'] || 0;
  const ctaClicks = funnelMap['cta_click'] || 0;
  const signupComplete = funnelMap['signup_complete'] || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Pageviews, sources, and conversion funnel</p>
      </div>

      {/* Signup Funnel */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Signup Funnel</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">Page Views</p>
            <p className="text-3xl font-bold">{pageViews.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">CTA Clicks</p>
            <p className="text-3xl font-bold">{ctaClicks.toLocaleString()}</p>
            {pageViews > 0 && (
              <p className="text-muted-foreground mt-1 text-xs">
                {((ctaClicks / pageViews) * 100).toFixed(1)}% of page views
              </p>
            )}
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">Signups Complete</p>
            <p className="text-3xl font-bold">{signupComplete.toLocaleString()}</p>
            {ctaClicks > 0 && (
              <p className="text-muted-foreground mt-1 text-xs">
                {((signupComplete / ctaClicks) * 100).toFixed(1)}% of CTA clicks
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Daily Pageviews Chart */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Daily Pageviews (Last 7 Days)</h2>
        {dailyRows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No data available yet.</p>
        ) : (
          <div className="space-y-2">
            {dailyRows.map((row) => (
              <div key={row.date} className="flex items-center gap-3">
                <span className="text-muted-foreground w-28 text-right text-sm">{row.date}</span>
                <div className="flex flex-1 items-center gap-2">
                  <div
                    className="bg-primary h-6 rounded"
                    style={{ width: `${Math.max((row.count / maxDailyCount) * 100, 2)}%` }}
                  />
                  <span className="text-sm font-medium">{row.count.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Top Pages */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">Top 10 Pages</h2>
          {topPagesRows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No data available yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium">Page</th>
                  <th className="pb-2 text-right font-medium">Views</th>
                </tr>
              </thead>
              <tbody>
                {topPagesRows.map((row) => (
                  <tr key={row.page} className="border-b last:border-0">
                    <td className="break-all py-2 font-mono text-xs">{row.page}</td>
                    <td className="py-2 text-right">{row.count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Top Referrers */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">Top Referral Sources</h2>
          {topReferrersRows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No data available yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium">Source</th>
                  <th className="pb-2 text-right font-medium">Visits</th>
                </tr>
              </thead>
              <tbody>
                {topReferrersRows.map((row) => (
                  <tr key={row.referrer} className="border-b last:border-0">
                    <td className="break-all py-2">{row.referrer}</td>
                    <td className="py-2 text-right">{row.count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
