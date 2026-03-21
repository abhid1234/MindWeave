import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db/client';
import { tilPosts, users, content } from '@/lib/db/schema';
import { sql, eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { TilGrid } from '@/components/til/TilGrid';
import { ContextualCTA } from '@/components/growth/ContextualCTA';
import { JsonLd } from '@/components/seo/JsonLd';
import type { TilPostWithDetails } from '@/types/til';

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);

  return {
    title: `TIL: ${decodedTag} — Today I Learned | Mindweave`,
    description: `Explore bite-sized learnings about ${decodedTag} shared by the Mindweave community. Discover tips, tricks, and insights on ${decodedTag}.`,
    openGraph: {
      title: `TIL: ${decodedTag} — Today I Learned | Mindweave`,
      description: `Explore bite-sized learnings about ${decodedTag} shared by the Mindweave community.`,
      type: 'website',
      siteName: 'Mindweave',
    },
    alternates: {
      canonical: `/til/topic/${encodeURIComponent(decodedTag)}`,
    },
  };
}

export default async function TilTopicPage({ params }: Props) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);

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
      .where(sql`${decodedTag} = ANY(${tilPosts.tags})`)
      .orderBy(desc(tilPosts.publishedAt))
      .limit(50),
  ]);

  if (rows.length === 0) {
    notFound();
  }

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
    name: `TIL: ${decodedTag} — Today I Learned`,
    description: `Bite-sized learnings about ${decodedTag} shared by the Mindweave community.`,
    url: `${baseUrl}/til/topic/${encodeURIComponent(decodedTag)}`,
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
          <h1 className="text-3xl font-bold">TIL: {decodedTag}</h1>
          <p className="text-muted-foreground mx-auto max-w-lg">
            Bite-sized learnings about <strong>{decodedTag}</strong> shared by the Mindweave
            community.
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
