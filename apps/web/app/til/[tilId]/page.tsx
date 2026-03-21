import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { getTilDetailAction } from '@/app/actions/til';
import { getSocialProofStats } from '@/app/actions/social-proof';
import { TilDetail } from '@/components/til/TilDetail';
import { Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { ContextualCTA } from '@/components/growth/ContextualCTA';
import { SignupBanner } from '@/components/growth/SignupBanner';
import { ShareButton } from '@/components/growth/ShareButton';
import { db } from '@/lib/db/client';
import { tilPosts } from '@/lib/db/schema';
import { eq, ne, and, sql } from 'drizzle-orm';

type Props = {
  params: Promise<{ tilId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tilId } = await params;
  const result = await getTilDetailAction(tilId);

  if (!result.success || !result.post) {
    return {
      title: 'TIL Not Found - Mindweave',
      description: 'This TIL is no longer available.',
    };
  }

  const { post } = result;
  const description = post.body
    ? post.body.slice(0, 160) + (post.body.length > 160 ? '...' : '')
    : `A TIL shared on Mindweave`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mindweave.space';
  const ogImageUrl = `${baseUrl}/api/og/til?id=${tilId}`;

  return {
    title: `${post.title} - TIL - Mindweave`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      siteName: 'Mindweave',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function TilDetailPage({ params }: Props) {
  const { tilId } = await params;
  const [session, result, stats] = await Promise.all([
    auth(),
    getTilDetailAction(tilId),
    getSocialProofStats(),
  ]);

  if (!result.success || !result.post) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="max-w-md px-4 text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full p-4">
            <Lightbulb className="text-primary h-8 w-8" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">TIL Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {result.message || 'This TIL is no longer available.'}
          </p>
          <Link
            href="/til"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium"
          >
            Browse TILs
          </Link>
        </div>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const { post } = result;

  // Fetch related TILs in parallel
  const [authorTilsRows, relatedTilsRows] = await Promise.all([
    db
      .select({ id: tilPosts.id, title: tilPosts.title })
      .from(tilPosts)
      .where(and(eq(tilPosts.userId, post.creator.id), ne(tilPosts.id, post.id)))
      .orderBy(sql`${tilPosts.publishedAt} DESC`)
      .limit(3),
    post.tags && post.tags.length > 0
      ? db
          .select({ id: tilPosts.id, title: tilPosts.title })
          .from(tilPosts)
          .where(
            and(
              ne(tilPosts.id, post.id),
              sql`${tilPosts.tags} && ${sql.raw(`ARRAY[${post.tags.map((t) => `'${t.replace(/'/g, "''")}'`).join(',')}]::text[]`)}`
            )
          )
          .orderBy(sql`${tilPosts.publishedAt} DESC`)
          .limit(3)
      : Promise.resolve([]),
  ]);

  const authorTils = authorTilsRows;
  const relatedTils = relatedTilsRows.filter((t) => !authorTils.some((a) => a.id === t.id));

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.publishedAt?.toISOString(),
    author: {
      '@type': 'Person',
      name: post.creator.name ?? post.creator.username ?? 'Mindweave User',
    },
    keywords: post.tags?.join(', '),
    publisher: {
      '@type': 'Organization',
      name: 'Mindweave',
      url: 'https://mindweave.space',
    },
    url: `${baseUrl}/til/${post.id}`,
  };

  const pageUrl = `${baseUrl}/til/${post.id}`;

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <div className="space-y-6">
        <div className="mx-auto flex max-w-3xl items-center justify-end">
          <ShareButton url={pageUrl} title={post.title} />
        </div>
        <TilDetail post={post} isAuthenticated={!!session?.user} />
        {(authorTils.length > 0 || relatedTils.length > 0) && (
          <div className="mx-auto max-w-3xl">
            <div className="space-y-4 border-t pt-6">
              {authorTils.length > 0 && (
                <div>
                  <h3 className="text-muted-foreground text-sm font-semibold">
                    More by this author
                  </h3>
                  <ul className="mt-2 space-y-1">
                    {authorTils.map((t) => (
                      <li key={t.id}>
                        <Link href={`/til/${t.id}`} className="text-sm hover:underline">
                          {t.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {relatedTils.length > 0 && (
                <div>
                  <h3 className="text-muted-foreground text-sm font-semibold">Related TILs</h3>
                  <ul className="mt-2 space-y-1">
                    {relatedTils.map((t) => (
                      <li key={t.id}>
                        <Link href={`/til/${t.id}`} className="text-sm hover:underline">
                          {t.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        {!session?.user && <ContextualCTA variant="til" />}
      </div>
      {!session?.user && stats?.data && <SignupBanner userCount={stats.data.userCount} />}
    </>
  );
}
