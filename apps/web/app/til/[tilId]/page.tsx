import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { getTilDetailAction } from '@/app/actions/til';
import { TilDetail } from '@/components/til/TilDetail';
import { Lightbulb } from 'lucide-react';
import Link from 'next/link';

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

  return {
    title: `${post.title} - TIL - Mindweave`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      siteName: 'Mindweave',
    },
  };
}

export default async function TilDetailPage({ params }: Props) {
  const { tilId } = await params;
  const [session, result] = await Promise.all([
    auth(),
    getTilDetailAction(tilId),
  ]);

  if (!result.success || !result.post) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center max-w-md px-4">
          <div className="rounded-full bg-primary/10 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Lightbulb className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">TIL Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {result.message || 'This TIL is no longer available.'}
          </p>
          <Link
            href="/til"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Browse TILs
          </Link>
        </div>
      </div>
    );
  }

  return <TilDetail post={result.post} isAuthenticated={!!session?.user} />;
}
