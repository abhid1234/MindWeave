import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { browseTilAction } from '@/app/actions/til';
import { getSocialProofStats } from '@/app/actions/social-proof';
import { TilGrid } from '@/components/til/TilGrid';
import { ContextualCTA } from '@/components/growth/ContextualCTA';
import { SignupBanner } from '@/components/growth/SignupBanner';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'TIL Feed - Mindweave',
  description:
    'Today I Learned — bite-sized learnings shared by the Mindweave community. Browse, upvote, and share your own TILs.',
  openGraph: {
    title: 'TIL Feed - Mindweave',
    description: 'Bite-sized learnings shared by the Mindweave community.',
    type: 'website',
    siteName: 'Mindweave',
    images: ['https://www.mindweave.space/opengraph-image'],
  },
  alternates: {
    types: {
      'application/rss+xml': 'https://www.mindweave.space/til/feed',
    },
  },
};

const jsonLdData = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'TIL Feed — Today I Learned',
  description: 'Bite-sized learnings shared by the Mindweave community.',
  url: 'https://www.mindweave.space/til',
};

export default async function TilPage() {
  const [session, result, stats] = await Promise.all([
    auth(),
    browseTilAction({ sort: 'trending', perPage: 20 }),
    getSocialProofStats(),
  ]);

  return (
    <>
      <JsonLd data={jsonLdData} />
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Today I Learned</h1>
          <p className="text-muted-foreground mx-auto max-w-lg">
            Bite-sized learnings from the community. Share what you discovered today.
          </p>
        </div>

        <TilGrid
          initialPosts={result.success ? result.posts : undefined}
          initialTotal={result.success ? result.pagination.total : undefined}
          initialPopularTags={result.success ? result.popularTags : undefined}
          isAuthenticated={!!session?.user}
        />

        {!session?.user && <ContextualCTA variant="til" />}
      </div>

      {!session?.user && stats?.data && <SignupBanner userCount={stats.data.userCount} />}
    </>
  );
}
