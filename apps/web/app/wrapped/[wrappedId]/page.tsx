import type { Metadata } from 'next';
import Link from 'next/link';
import { getWrappedByShareIdAction } from '@/app/actions/wrapped';
import { WrappedStoryView } from '@/components/wrapped/WrappedStoryView';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface PageProps {
  params: Promise<{ wrappedId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { wrappedId } = await params;
  const result = await getWrappedByShareIdAction(wrappedId);

  if (!result.success || !result.data) {
    return { title: 'Not Found | Mindweave' };
  }

  const { stats } = result.data;
  const title = `${stats.knowledgePersonality} - Knowledge Wrapped`;
  const description = `${stats.totalItems} items captured, ${stats.longestStreak} day streak, top topics: ${stats.topTags.slice(0, 3).join(', ')}`;

  return {
    title: `${title} | Mindweave`,
    description,
    openGraph: {
      title,
      description,
      images: [`${APP_URL}/api/og/wrapped?id=${wrappedId}`],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${APP_URL}/api/og/wrapped?id=${wrappedId}`],
    },
  };
}

export default async function PublicWrappedPage({ params }: PageProps) {
  const { wrappedId } = await params;
  const result = await getWrappedByShareIdAction(wrappedId);

  if (!result.success || !result.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Not Found</h1>
          <p className="mt-2 text-muted-foreground">This Knowledge Wrapped doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Knowledge Wrapped</h1>
          <p className="mt-2 text-muted-foreground">
            Generated {new Date(result.data.createdAt).toLocaleDateString()}
          </p>
        </div>

        <WrappedStoryView stats={result.data.stats} autoAdvance={false} />

        <div className="mt-8 text-center">
          <Link
            href="/dashboard/wrapped"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create Your Own Wrapped
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            Powered by <Link href="/" className="text-primary hover:underline">Mindweave</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
