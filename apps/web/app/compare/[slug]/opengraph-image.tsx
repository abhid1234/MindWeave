import { ImageResponse } from 'next/og';
import { comparePages } from '../data';

export const runtime = 'edge';
export const alt = 'Mindweave Comparison';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = comparePages[slug];
  const title = page?.title ?? 'Mindweave';
  const description = page?.description ?? 'AI-Powered Personal Knowledge Hub';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          fontSize: 56,
          fontWeight: 800,
          color: 'white',
          letterSpacing: -2,
          display: 'flex',
          textAlign: 'center',
          maxWidth: '80%',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 24,
          color: '#a5b4fc',
          marginTop: 16,
          display: 'flex',
          textAlign: 'center',
          maxWidth: '70%',
        }}
      >
        {description}
      </div>
    </div>,
    { ...size }
  );
}
