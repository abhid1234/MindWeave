import { Metadata } from 'next';
import { db } from '@/lib/db/client';
import { tilPosts, users, content } from '@/lib/db/schema';
import { eq, desc, gte } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { TilGrid } from '@/components/til/TilGrid';
import { ContextualCTA } from '@/components/growth/ContextualCTA';
import { JsonLd } from '@/components/seo/JsonLd';
import type { TilPostWithDetails } from '@/types/til';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Trending TILs — Today I Learned | Mindweave',
  description:
    'The most upvoted Today I Learned posts from the past week. Discover the best bite-sized learnings from the Mindweave community.',
  openGraph: {
    title: 'Trending TILs — Today I Learned | Mindweave',
    description:
      'The most upvoted Today I Learned posts from the past week. Discover the best bite-sized learnings from the Mindweave community.',
    type: 'website',
    siteName: 'Mindweave',
  },
  alternates: {
    canonical: '/til/trending',
  },
};

export default async function TrendingTilPage() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [session, rows] = await Promise.all([
    auth(),
    db
      .select({
        id: tilPosts.id,
        contentId: tilPosts.contentId,
        title: tilPosts.title,
        body: tilPosts.body,
        tags: tilPosts.tags,
        upvoteCount: tilPosts.upvoteCount,
        viewCount: tilPosts.viewCount,
        publishedAt: tilPosts.publishedAt,
        creatorId: users.id,
        creatorName: users.name,
        creatorUsername: users.username,
        creatorImage: users.image,
        shareId: content.shareId,
      })
      .from(tilPosts)
      .innerJoin(users, eq(tilPosts.userId, users.id))
      .innerJoin(content, eq(tilPosts.contentId, content.id))
      .where(gte(tilPosts.publishedAt, sevenDaysAgo))
      .orderBy(desc(tilPosts.upvoteCount))
      .limit(50),
  ]);

  const posts: TilPostWithDetails[] = rows.map((row) => ({
    id: row.id,
    contentId: row.contentId,
    title: row.title,
    body: row.body,
    tags: row.tags,
    upvoteCount: row.upvoteCount,
    viewCount: row.viewCount,
    publishedAt: row.publishedAt,
    creator: {
      id: row.creatorId,
      name: row.creatorName,
      username: row.creatorUsername,
      image: row.creatorImage,
    },
    hasUpvoted: false,
    shareId: row.shareId,
  }));

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Trending TILs — Today I Learned',
    description: 'The most upvoted Today I Learned posts from the past week on Mindweave.',
    url: `${baseUrl}/til/trending`,
    numberOfItems: posts.length,
    hasPart: posts.slice(0, 10).map((post) => ({
      '@type': 'Article',
      name: post.title,
      url: `${baseUrl}/til/${post.id}`,
      datePublished: post.publishedAt,
    })),
  };

  return (
    <>
      <JsonLd data={jsonLdData} />
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Trending TILs</h1>
          <p className="text-muted-foreground mx-auto max-w-lg">
            The most upvoted Today I Learned posts from the past 7 days.
          </p>
        </div>

        <TilGrid
          initialPosts={posts}
          initialTotal={posts.length}
          isAuthenticated={!!session?.user}
        />

        {!session?.user && <ContextualCTA variant="til" />}
      </div>
    </>
  );
}
