import { Metadata } from 'next';
import { getSharedContentAction } from '@/app/actions/content';
import { FileText, Link as LinkIcon, File, Image as ImageIcon, ExternalLink } from 'lucide-react';
import NextImage from 'next/image';
import Link from 'next/link';
import { formatDateLongUTC } from '@/lib/utils';

type Props = {
  params: Promise<{ shareId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareId } = await params;
  const result = await getSharedContentAction(shareId);

  if (!result.success || !result.content) {
    return {
      title: 'Content Not Found - Mindweave',
      description: 'This shared content is no longer available.',
    };
  }

  const { content } = result;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const description = content.body
    ? content.body.slice(0, 160) + (content.body.length > 160 ? '...' : '')
    : `A ${content.type} shared via Mindweave`;

  return {
    title: `${content.title} - Mindweave`,
    description,
    openGraph: {
      title: content.title,
      description,
      type: 'article',
      url: `${baseUrl}/share/${shareId}`,
      siteName: 'Mindweave',
      ...(content.type === 'file' &&
        content.metadata?.fileType?.startsWith('image/') &&
        content.metadata?.filePath && {
          images: [
            {
              url: content.metadata.filePath,
              alt: content.title,
            },
          ],
        }),
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description,
    },
  };
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'note':
      return <FileText className="h-5 w-5" aria-hidden="true" />;
    case 'link':
      return <LinkIcon className="h-5 w-5" aria-hidden="true" />;
    case 'file':
      return <File className="h-5 w-5" aria-hidden="true" />;
    default:
      return <FileText className="h-5 w-5" aria-hidden="true" />;
  }
}

function getFileIcon(fileType?: string) {
  if (!fileType) return <File className="h-8 w-8 text-gray-500" aria-hidden="true" />;
  if (fileType.startsWith('image/')) {
    return <ImageIcon className="h-8 w-8 text-blue-500" aria-hidden="true" />;
  }
  if (fileType === 'application/pdf') {
    return <FileText className="h-8 w-8 text-red-500" aria-hidden="true" />;
  }
  return <File className="h-8 w-8 text-gray-500" aria-hidden="true" />;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function SharePage({ params }: Props) {
  const { shareId } = await params;
  const result = await getSharedContentAction(shareId);

  if (!result.success || !result.content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="rounded-full bg-muted p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Content Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {result.message || 'This shared content is no longer available.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to Mindweave
          </Link>
        </div>
      </div>
    );
  }

  const { content } = result;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              Mindweave
            </Link>
            <span className="text-sm text-muted-foreground">
              Shared content
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <article className="bg-card rounded-lg border shadow-sm">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                {getTypeIcon(content.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold mb-1">{content.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {formatDateLongUTC(content.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* File preview */}
            {content.type === 'file' && content.metadata?.filePath && (
              <div className="mb-6">
                {content.metadata.fileType?.startsWith('image/') ? (
                  <div className="relative w-full h-64 rounded-lg overflow-hidden">
                    <NextImage
                      src={content.metadata.filePath}
                      alt={content.title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 700px"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg">
                    {getFileIcon(content.metadata.fileType)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {content.metadata.fileName || content.title}
                      </p>
                      {content.metadata.fileSize && (
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(content.metadata.fileSize)}
                        </p>
                      )}
                    </div>
                    <a
                      href={content.metadata.filePath}
                      download
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
                    >
                      Download
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* URL for links */}
            {content.type === 'link' && content.url && (
              <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-4 mb-6 bg-secondary/50 rounded-lg text-primary hover:bg-secondary transition-colors"
              >
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{content.url}</span>
              </a>
            )}

            {/* Content body */}
            {content.body && (
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                {content.body}
              </div>
            )}

            {/* Tags */}
            {(content.tags.length > 0 || content.autoTags.length > 0) && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex flex-wrap gap-2">
                  {content.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                  {content.autoTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Shared via{' '}
            <Link href="/" className="text-primary hover:underline">
              Mindweave
            </Link>{' '}
            - Your personal knowledge hub
          </p>
        </div>
      </main>
    </div>
  );
}
