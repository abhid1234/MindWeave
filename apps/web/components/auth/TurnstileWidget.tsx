'use client';

import Script from 'next/script';
import { useCallback, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback': () => void;
          'error-callback': () => void;
        },
      ) => string;
      reset: (widgetId: string) => void;
    };
  }
}

export function TurnstileWidget() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [token, setToken] = useState('');
  const widgetIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const renderWidget = useCallback(() => {
    if (!window.turnstile || !containerRef.current || !siteKey) return;

    // Avoid double-rendering
    if (widgetIdRef.current !== null) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (t: string) => setToken(t),
      'expired-callback': () => {
        setToken('');
        if (widgetIdRef.current !== null) {
          window.turnstile?.reset(widgetIdRef.current);
        }
      },
      'error-callback': () => {
        setToken('');
      },
    });
  }, [siteKey]);

  if (!siteKey) {
    return null;
  }

  return (
    <>
      {/* SECURITY NOTE: SRI (Subresource Integrity) is intentionally NOT used here.
          Cloudflare updates the Turnstile script frequently, which would break SRI hashes.
          The script is mitigated by CSP restricting script sources. */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <div className="flex justify-center">
        <div ref={containerRef} />
      </div>
      <input type="hidden" name="cf-turnstile-response" value={token} />
    </>
  );
}
