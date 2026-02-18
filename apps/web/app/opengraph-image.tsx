import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Mindweave - AI-Powered Personal Knowledge Hub';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Icon: concentric circles mimicking the neural network logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
              }}
            />
          </div>
          {/* Orbiting dots */}
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <div
              key={deg}
              style={{
                position: 'absolute',
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.7)',
                transform: `rotate(${deg}deg) translateY(-58px)`,
                display: 'flex',
              }}
            />
          ))}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: 'white',
            letterSpacing: -2,
            display: 'flex',
          }}
        >
          Mindweave
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: '#a5b4fc',
            marginTop: 12,
            display: 'flex',
          }}
        >
          AI-Powered Personal Knowledge Hub
        </div>

        {/* Sub-line */}
        <div
          style={{
            fontSize: 18,
            color: '#94a3b8',
            marginTop: 16,
            display: 'flex',
          }}
        >
          Capture, organize, and rediscover your ideas with AI
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 36,
          }}
        >
          {['Semantic Search', 'AI Tagging', 'Knowledge Q&A'].map((pill) => (
            <div
              key={pill}
              style={{
                padding: '8px 20px',
                borderRadius: 20,
                border: '1px solid rgba(99, 102, 241, 0.4)',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#c7d2fe',
                fontSize: 15,
                display: 'flex',
              }}
            >
              {pill}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
