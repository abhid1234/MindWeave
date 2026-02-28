import { ImageResponse } from 'next/og';
import { getPublicGraphAction } from '@/app/actions/public-graph';

const COMMUNITY_COLORS = [
  '#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6',
  '#22c55e', '#ef4444', '#06b6d4', '#eab308', '#64748b',
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const graphId = searchParams.get('id');

  if (!graphId) {
    return new Response('Missing id', { status: 400 });
  }

  const result = await getPublicGraphAction(graphId);

  if (!result.success || !result.data) {
    return new Response('Not found', { status: 404 });
  }

  const { title, graphData } = result.data;
  const stats = graphData.stats;
  const nodeCount = stats?.nodeCount ?? graphData.nodes.length;
  const edgeCount = stats?.edgeCount ?? graphData.edges.length;
  const communityCount = stats?.communityCount ?? 0;
  const topTags = stats?.topTags ?? [];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1e1b4b, #312e81, #4f46e5)',
          fontFamily: 'system-ui, sans-serif',
          color: 'white',
          padding: '60px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative community-colored circles */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex' }}>
          {COMMUNITY_COLORS.slice(0, 6).map((color, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: `${60 + i * 20}px`,
                height: `${60 + i * 20}px`,
                borderRadius: '50%',
                background: color,
                opacity: 0.12,
                top: `${80 + (i % 3) * 160}px`,
                right: `${40 + (i % 2) * 120 + i * 30}px`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', zIndex: 1 }}>
          {/* Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              🧠
            </div>
            <div style={{ fontSize: '18px', fontWeight: 600, opacity: 0.8 }}>Mindweave</div>
          </div>

          {/* Title */}
          <div style={{ fontSize: '48px', fontWeight: 'bold', lineHeight: 1.2, marginBottom: '24px', maxWidth: '800px' }}>
            {title}
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '32px', fontSize: '20px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{nodeCount}</div>
              <div style={{ opacity: 0.7 }}>nodes</div>
            </div>
            <div style={{ opacity: 0.4, fontSize: '24px' }}>&middot;</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{edgeCount}</div>
              <div style={{ opacity: 0.7 }}>connections</div>
            </div>
            {communityCount > 0 && (
              <>
                <div style={{ opacity: 0.4, fontSize: '24px' }}>&middot;</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{communityCount}</div>
                  <div style={{ opacity: 0.7 }}>communities</div>
                </div>
              </>
            )}
          </div>

          {/* Top tags */}
          {topTags.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {topTags.slice(0, 8).map((tag) => (
                <div
                  key={tag}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '16px',
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 'auto', fontSize: '14px', opacity: 0.5 }}>
            mindweave.app
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
