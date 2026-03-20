import { db } from '@/lib/db/client';
import { tilPosts } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.mindweave.space';

export async function GET() {
  const posts = await db
    .select({
      id: tilPosts.id,
      title: tilPosts.title,
      body: tilPosts.body,
      publishedAt: tilPosts.publishedAt,
    })
    .from(tilPosts)
    .orderBy(desc(tilPosts.publishedAt))
    .limit(50);

  const items = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/til/${post.id}</link>
      <guid isPermaLink="true">${baseUrl}/til/${post.id}</guid>
      <description><![CDATA[${(post.body ?? '').slice(0, 300)}]]></description>
      <pubDate>${post.publishedAt ? new Date(post.publishedAt).toUTCString() : ''}</pubDate>
    </item>`
    )
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Mindweave TIL Feed</title>
    <link>${baseUrl}/til</link>
    <description>Today I Learned posts from the Mindweave community</description>
    <language>en-us</language>
    <atom:link href="${baseUrl}/til/feed" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
