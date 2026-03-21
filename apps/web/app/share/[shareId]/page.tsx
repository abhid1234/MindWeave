import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { getSharedContentAction } from '@/app/actions/content';
import { getSocialProofStats } from '@/app/actions/social-proof';
import { FileText, Link as LinkIcon, File, Image as ImageIcon, ExternalLink } from 'lucide-react';
import NextImage from 'next/image';
import Link from 'next/link';
import { formatDateLongUTC } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/editor/MarkdownRenderer';
import { ContextualCTA } from '@/components/growth/ContextualCTA';
import { SignupBanner } from '@/components/growth/SignupBanner';
import { ShareButton } from '@/components/growth/ShareButton';

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

  const ogImageUrl = `${baseUrl}/api/og/embed?id=${shareId}`;

  return {
    title: `${content.title} - Mindweave`,
    description,
    openGraph: {
      title: content.title,
      description,
      type: 'article',
      url: `${baseUrl}/share/${shareId}`,
      siteName: 'Mindweave',
      images:
        content.type === 'file' &&
        content.metadata?.fileType?.startsWith('image/') &&
        content.metadata?.filePath
          ? [{ url: content.metadata.filePath, alt: content.title }]
          : [{ url: ogImageUrl, width: 1200, height: 630, alt: content.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description,
      images: [ogImageUrl],
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
  const [session, result, stats] = await Promise.all([
    auth(),
    getSharedContentAction(shareId),
    getSocialProofStats(),
  ]);

  if (!result.success || !result.content) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div
          className="animate-fade-up max-w-md px-4 text-center"
          style={{ animationFillMode: 'backwards' }}
        >
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full p-4">
            <FileText className="text-primary h-8 w-8" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Content Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {result.message || 'This shared content is no longer available.'}
          </p>
          <Link
            href="/"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium"
          >
            Go to Mindweave
          </Link>
        </div>
      </div>
    );
  }

  const { content } = result;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mindweave.space';
  const pageUrl = `${baseUrl}/share/${shareId}`;

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header
        className="bg-card animate-fade-up border-b"
        style={{ animationFillMode: 'backwards' }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              Mindweave
            </Link>
            <span className="text-muted-foreground text-sm">Shared content</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <article
          className="bg-card shadow-soft animate-fade-up rounded-xl border"
          style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}
        >
          {/* Header */}
          <div className="border-b p-6">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary rounded-lg p-2">
                {getTypeIcon(content.type)}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="mb-1 text-2xl font-bold">{content.title}</h1>
                <p className="text-muted-foreground text-sm">
                  {formatDateLongUTC(content.createdAt)}
                </p>
              </div>
              <ShareButton url={pageUrl} title={content.title} />
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* File preview */}
            {content.type === 'file' && content.metadata?.filePath && (
              <div className="mb-6">
                {content.metadata.fileType?.startsWith('image/') ? (
                  <div className="relative h-64 w-full overflow-hidden rounded-lg">
                    <NextImage
                      src={content.metadata.filePath}
                      alt={content.title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 700px"
                    />
                  </div>
                ) : (
                  <div className="bg-secondary/50 flex items-center gap-3 rounded-lg p-4">
                    {getFileIcon(content.metadata.fileType)}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {content.metadata.fileName || content.title}
                      </p>
                      {content.metadata.fileSize && (
                        <p className="text-muted-foreground text-sm">
                          {formatFileSize(content.metadata.fileSize)}
                        </p>
                      )}
                    </div>
                    <a
                      href={content.metadata.filePath}
                      download
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-3 py-2 text-sm font-medium"
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
                className="bg-secondary/50 text-primary hover:bg-secondary mb-6 flex items-center gap-2 rounded-lg p-4 transition-colors"
              >
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{content.url}</span>
              </a>
            )}

            {/* Content body */}
            {/* SECURITY: MarkdownRenderer uses react-markdown which renders Markdown safely
                without dangerouslySetInnerHTML. HTML in markdown is NOT rendered. */}
            {content.body && <MarkdownRenderer content={content.body} />}

            {/* Tags */}
            {(content.tags.length > 0 || content.autoTags.length > 0) && (
              <div className="mt-6 border-t pt-6">
                <div className="flex flex-wrap gap-2">
                  {content.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                  {content.autoTags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-secondary text-muted-foreground rounded-full px-3 py-1 text-xs font-medium"
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
        <div
          className="text-muted-foreground animate-fade-up mt-8 text-center text-sm"
          style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}
        >
          <p>
            Shared via{' '}
            <Link href="/" className="text-primary hover:underline">
              Mindweave
            </Link>{' '}
            - Your personal knowledge hub
          </p>
        </div>

        {!session?.user && <ContextualCTA variant="share" />}
      </main>

      {!session?.user && stats?.data && <SignupBanner userCount={stats.data.userCount} />}
    </div>
  );
}
