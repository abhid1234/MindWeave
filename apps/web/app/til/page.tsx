import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { browseTilAction } from '@/app/actions/til';
import { TilGrid } from '@/components/til/TilGrid';

export const metadata: Metadata = {
  title: 'TIL Feed - Mindweave',
  description:
    'Today I Learned — bite-sized learnings shared by the Mindweave community. Browse, upvote, and share your own TILs.',
  openGraph: {
    title: 'TIL Feed - Mindweave',
    description: 'Bite-sized learnings shared by the Mindweave community.',
    type: 'website',
    siteName: 'Mindweave',
  },
};

export default async function TilPage() {
  const [session, result] = await Promise.all([
    auth(),
    browseTilAction({ sort: 'trending', perPage: 20 }),
  ]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Today I Learned</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Bite-sized learnings from the community. Share what you discovered today.
        </p>
      </div>

      <TilGrid
        initialPosts={result.success ? result.posts : undefined}
        initialTotal={result.success ? result.pagination.total : undefined}
        initialPopularTags={result.success ? result.popularTags : undefined}
        isAuthenticated={!!session?.user}
      />
    </div>
  );
}
