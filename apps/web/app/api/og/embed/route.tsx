import { ImageResponse } from 'next/og';
import { getEmbedDataAction } from '@/app/actions/embed';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shareId = searchParams.get('id');

  if (!shareId) {
    return new Response('Missing id', { status: 400 });
  }

  const result = await getEmbedDataAction(shareId);

  if (!result.success || !result.data) {
    return new Response('Not found', { status: 404 });
  }

  const { data } = result;
  const allTags = [...data.tags, ...data.autoTags].slice(0, 5);
  const bodyPreview = data.body
    ? data.body.slice(0, 200) + (data.body.length > 200 ? '...' : '')
    : null;

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
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)',
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
            gap: '20px',
            maxWidth: '900px',
          }}
        >
          <div
            style={{
              fontSize: '20px',
              opacity: 0.8,
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            {data.type === 'note' ? 'Note' : data.type === 'link' ? 'Link' : 'File'}
          </div>

          <div
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            {data.title.length > 80 ? data.title.slice(0, 80) + '...' : data.title}
          </div>

          {bodyPreview && (
            <div
              style={{
                fontSize: '20px',
                opacity: 0.85,
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              {bodyPreview}
            </div>
          )}

          {allTags.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '10px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {allTags.map((tag) => (
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
          )}

          <div style={{ marginTop: '24px', fontSize: '16px', opacity: 0.6 }}>
            Curated with Mindweave
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
