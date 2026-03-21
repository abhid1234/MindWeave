import { ImageResponse } from 'next/og';
import { db } from '@/lib/db/client';
import { tilPosts, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tilId = searchParams.get('id');

  if (!tilId) {
    return new Response('Missing id', { status: 400 });
  }

  const post = await db
    .select({
      title: tilPosts.title,
      tags: tilPosts.tags,
      authorName: users.name,
    })
    .from(tilPosts)
    .leftJoin(users, eq(tilPosts.userId, users.id))
    .where(eq(tilPosts.id, tilId))
    .limit(1);

  if (!post[0]) {
    return new Response('Not found', { status: 404 });
  }

  const { title, tags, authorName } = post[0];
  const displayTags = (tags || []).slice(0, 3);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px',
        background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #a855f7)',
        fontFamily: 'system-ui, sans-serif',
        color: 'white',
      }}
    >
      <div style={{ fontSize: '24px', opacity: 0.8, marginBottom: '16px' }}>Today I Learned</div>
      <div
        style={{
          fontSize: '48px',
          fontWeight: 'bold',
          lineHeight: 1.2,
          maxWidth: '900px',
        }}
      >
        {title}
      </div>
      {displayTags.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
          {displayTags.map((tag: string) => (
            <div
              key={tag}
              style={{
                padding: '6px 16px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.2)',
                fontSize: '18px',
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto',
          paddingTop: '32px',
        }}
      >
        <div style={{ fontSize: '20px', opacity: 0.8 }}>by {authorName || 'Anonymous'}</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>mindweave.space</div>
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
