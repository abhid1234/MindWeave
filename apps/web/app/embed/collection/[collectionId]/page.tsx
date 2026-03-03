import { getEmbedCollectionAction } from '@/app/actions/embed';
import { FolderOpen } from 'lucide-react';
import Link from 'next/link';

type Props = {
  params: Promise<{ collectionId: string }>;
  searchParams: Promise<{ theme?: string }>;
};

export default async function EmbedCollectionPage({ params, searchParams }: Props) {
  const { collectionId } = await params;
  const { theme } = await searchParams;
  const isDark = theme === 'dark';
  const result = await getEmbedCollectionAction(collectionId);

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
        <p className="text-sm opacity-70">Collection not available</p>
      </div>
    );
  }

  const { data } = result;
  const accentColor = data.color || '#6366f1';

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
      {/* Color accent bar */}
      <div style={{ height: 4, background: accentColor, borderRadius: '12px 12px 0 0' }} />

      {/* Content */}
      <div style={{ padding: '20px 24px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `${accentColor}20`,
              color: accentColor,
            }}
          >
            <FolderOpen className="h-4 w-4" />
          </span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>{data.name}</div>
            <div style={{ fontSize: 13, opacity: 0.6 }}>
              {data.itemCount} {data.itemCount === 1 ? 'item' : 'items'}
              {data.creator.name && ` · by ${data.creator.name}`}
            </div>
          </div>
        </div>

        {data.description && (
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              opacity: 0.8,
              margin: '0 0 12px',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {data.description}
          </p>
        )}

        {data.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {data.tags.map((tag) => (
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
          href={`${baseUrl}/marketplace`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12,
            color: '#6366f1',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Browse collections →
        </Link>
      </div>
    </div>
  );
}
