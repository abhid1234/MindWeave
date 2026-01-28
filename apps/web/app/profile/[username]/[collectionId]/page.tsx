import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPublicCollectionContent } from '@/app/actions/profile';
import { FileText, Link as LinkIcon, File } from 'lucide-react';
import { formatDateLongUTC } from '@/lib/utils';

type Props = {
  params: Promise<{ username: string; collectionId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, collectionId } = await params;
  const result = await getPublicCollectionContent(username, collectionId);

  if (!result.success || !result.collection) {
    return {
      title: 'Collection Not Found - Mindweave',
    };
  }

  const { collection } = result;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const description = collection.description ?? `${collection.name} by ${collection.ownerName ?? collection.ownerUsername}`;

  return {
    title: `${collection.name} - ${collection.ownerName ?? collection.ownerUsername} - Mindweave`,
    description,
    openGraph: {
      title: collection.name,
      description,
      type: 'website',
      url: `${baseUrl}/profile/${username}/${collectionId}`,
      siteName: 'Mindweave',
    },
    twitter: {
      card: 'summary',
      title: collection.name,
      description,
    },
  };
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'note':
      return <FileText className="h-4 w-4" />;
    case 'link':
      return <LinkIcon className="h-4 w-4" />;
    default:
      return <File className="h-4 w-4" />;
  }
}

export default async function PublicCollectionPage({ params }: Props) {
  const { username, collectionId } = await params;
  const result = await getPublicCollectionContent(username, collectionId);

  if (!result.success || !result.collection) {
    notFound();
  }

  const { collection } = result;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              Mindweave
            </Link>
            <span className="text-sm text-muted-foreground">Public Collection</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm text-muted-foreground">
          <Link href={`/profile/${username}`} className="hover:text-foreground">
            @{collection.ownerUsername}
          </Link>
          {' / '}
          <span className="text-foreground">{collection.name}</span>
        </div>

        <h1 className="text-2xl font-bold mb-2">{collection.name}</h1>
        {collection.description && (
          <p className="text-muted-foreground mb-6">{collection.description}</p>
        )}

        {collection.items.length === 0 ? (
          <p className="text-muted-foreground">No shared content in this collection.</p>
        ) : (
          <div className="space-y-3">
            {collection.items.map((item) => (
              <div key={item.id} className="rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{item.title}</h3>
                    {item.body && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                        {item.body}
                      </p>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline mt-1 block truncate"
                      >
                        {item.url}
                      </a>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                      <span className="text-xs text-muted-foreground">
                        {formatDateLongUTC(item.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
