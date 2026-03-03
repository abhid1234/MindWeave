import { getEmbedDataAction } from '@/app/actions/embed';
import { FileText, Link as LinkIcon, File } from 'lucide-react';
import Link from 'next/link';

type Props = {
  params: Promise<{ shareId: string }>;
  searchParams: Promise<{ theme?: string }>;
};

function getTypeIcon(type: string) {
  switch (type) {
    case 'note':
      return <FileText className="h-4 w-4" aria-hidden="true" />;
    case 'link':
      return <LinkIcon className="h-4 w-4" aria-hidden="true" />;
    case 'file':
      return <File className="h-4 w-4" aria-hidden="true" />;
    default:
      return <FileText className="h-4 w-4" aria-hidden="true" />;
  }
}

export default async function EmbedContentPage({ params, searchParams }: Props) {
  const { shareId } = await params;
  const { theme } = await searchParams;
  const isDark = theme === 'dark';
  const result = await getEmbedDataAction(shareId);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!result.success || !result.data) {
    return (
      <div
        className="flex items-center justify-center p-6"
        style={{
          maxWidth: 600,
          maxHeight: 400,
          background: isDark ? '#1a1a2e' : '#ffffff',
          color: isDark ? '#e0e0e0' : '#333333',
          borderRadius: 12,
          border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
        }}
      >
        <p className="text-sm opacity-70">Content not available</p>
      </div>
    );
  }

  const { data } = result;
  const allTags = [...data.tags, ...data.autoTags].slice(0, 5);
  const bodyPreview = data.body
    ? data.body.slice(0, 280) + (data.body.length > 280 ? '...' : '')
    : null;

  return (
    <div
      style={{
        maxWidth: 600,
        maxHeight: 400,
        overflow: 'auto',
        background: isDark ? '#1a1a2e' : '#ffffff',
        color: isDark ? '#e0e0e0' : '#1f2937',
        borderRadius: 12,
        border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Content */}
      <div style={{ padding: '20px 24px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 6,
              background: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)',
              color: '#6366f1',
            }}
          >
            {getTypeIcon(data.type)}
          </span>
          <Link
            href={`${baseUrl}/share/${shareId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 18,
              fontWeight: 700,
              textDecoration: 'none',
              color: 'inherit',
              lineHeight: 1.3,
            }}
          >
            {data.title}
          </Link>
        </div>

        {bodyPreview && (
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              opacity: 0.8,
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {bodyPreview}
          </p>
        )}

        {allTags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {allTags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 12,
                  padding: '2px 10px',
                  borderRadius: 12,
                  background: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)',
                  color: '#6366f1',
                  fontWeight: 500,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer watermark */}
      <div
        style={{
          padding: '10px 24px',
          borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          href={baseUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12,
            color: isDark ? '#888' : '#9ca3af',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Curated with Mindweave
        </Link>
        <Link
          href={`${baseUrl}/share/${shareId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12,
            color: '#6366f1',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          View full →
        </Link>
      </div>
    </div>
  );
}
