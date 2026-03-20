import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { getTilDetailAction } from '@/app/actions/til';
import { TilDetail } from '@/components/til/TilDetail';
import { Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';

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
  const [session, result] = await Promise.all([auth(), getTilDetailAction(tilId)]);

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

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.publishedAt,
    author: {
      '@type': 'Person',
      name: post.creator.name ?? post.creator.username ?? 'Mindweave User',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Mindweave',
      url: baseUrl,
    },
    url: `${baseUrl}/til/${post.id}`,
  };

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <TilDetail post={post} isAuthenticated={!!session?.user} />
    </>
  );
}
