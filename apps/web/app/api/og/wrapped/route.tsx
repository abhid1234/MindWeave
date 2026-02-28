import { ImageResponse } from 'next/og';
import { getWrappedByShareIdAction } from '@/app/actions/wrapped';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shareId = searchParams.get('id');

  if (!shareId) {
    return new Response('Missing id', { status: 400 });
  }

  const result = await getWrappedByShareIdAction(shareId);

  if (!result.success || !result.data) {
    return new Response('Not found', { status: 404 });
  }

  const { stats } = result.data;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #a855f7)',
          fontFamily: 'system-ui, sans-serif',
          color: 'white',
          padding: '60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div style={{ fontSize: '24px', opacity: 0.8, letterSpacing: '2px', textTransform: 'uppercase' }}>
            Knowledge Wrapped
          </div>

          <div style={{ fontSize: '72px', fontWeight: 'bold' }}>
            {stats.knowledgePersonality}
          </div>

          <div style={{ fontSize: '20px', opacity: 0.9 }}>
            {stats.personalityDescription}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '40px',
              marginTop: '20px',
              fontSize: '18px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{stats.totalItems}</div>
              <div style={{ opacity: 0.8 }}>items</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{stats.longestStreak}</div>
              <div style={{ opacity: 0.8 }}>day streak</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{stats.uniqueTagCount}</div>
              <div style={{ opacity: 0.8 }}>tags</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {stats.topTags.slice(0, 5).map((tag) => (
              <div
                key={tag}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '16px',
                }}
              >
                {tag}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', fontSize: '16px', opacity: 0.6 }}>
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
