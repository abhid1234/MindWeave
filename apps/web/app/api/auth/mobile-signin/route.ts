import { signIn } from '@/lib/auth';
import { NextResponse } from 'next/server';

const BASE_URL = process.env.AUTH_URL || 'https://mindweave.space';

/**
 * Resolve the Google OAuth URL from signIn().
 * signIn with redirect:false may return a string, an object with .url, or throw NEXT_REDIRECT.
 */
async function getGoogleOAuthUrl(): Promise<string | null> {
  try {
    const result = await signIn('google', {
      redirectTo: '/api/auth/mobile-auth-complete',
      redirect: false,
    });

    if (typeof result === 'string') return result;
    if (result?.url) return result.url;
    return null;
  } catch (error: unknown) {
    // signIn might throw a redirect (Next.js NEXT_REDIRECT error)
    const err = error as { digest?: string; url?: string };
    if (err?.digest?.startsWith('NEXT_REDIRECT')) {
      const parts = err.digest!.split(';');
      const redirectUrl = parts[2];
      if (redirectUrl) return redirectUrl;
    }
    throw err;
  }
}

/**
 * Build an HTML intermediary page that opens the OAuth URL via JS bridge or JS navigation.
 * This avoids 302 redirects which the WebView follows directly (loading Google OAuth in WebView).
 * JS-initiated navigation reliably triggers shouldOverrideUrlLoading in Android WebView.
 */
function buildIntermediaryHtml(oauthUrl: string): string {
  // Escape the URL for safe embedding in JS strings
  const escapedUrl = oauthUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Signing in...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      color: #334155;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .manual-link {
      display: inline-block;
      margin-top: 1.5rem;
      padding: 0.75rem 1.5rem;
      background: #4f46e5;
      color: white;
      text-decoration: none;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 0.875rem;
    }
    .manual-link:hover { background: #4338ca; }
    #fallback { display: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <p>Opening Google Sign-In...</p>
    <div id="fallback">
      <p style="font-size: 0.875rem; color: #64748b;">
        If nothing happened, tap the button below:
      </p>
      <a class="manual-link" href="${escapedUrl}">Open Google Sign-In</a>
    </div>
  </div>
  <script>
    (function() {
      var url = '${escapedUrl}';
      var opened = false;

      // Try 1: Use native JS bridge to open in Chrome
      if (window.MindweaveNative && window.MindweaveNative.openExternal) {
        try {
          window.MindweaveNative.openExternal(url);
          opened = true;
        } catch (e) {}
      }

      // Try 2: JS-initiated navigation (triggers shouldOverrideUrlLoading)
      if (!opened) {
        window.location.href = url;
      }

      // Show fallback link after 3 seconds in case nothing worked
      setTimeout(function() {
        document.getElementById('fallback').style.display = 'block';
      }, 3000);
    })();
  </script>
</body>
</html>`;
}

// This endpoint handles OAuth initiation for mobile/Capacitor apps.
// It calls signIn() directly which internally uses skipCSRFCheck.
export async function GET(request: Request) {
  const userAgent = request.headers.get('user-agent') || '';
  const isWebView = /Android.*; wv\b/.test(userAgent);

  try {
    const oauthUrl = await getGoogleOAuthUrl();

    if (!oauthUrl) {
      return NextResponse.redirect(
        `${BASE_URL}/login?error=MobileSigninFailed`,
        302
      );
    }

    // WebView: return HTML intermediary page (no 302 redirect)
    if (isWebView) {
      return new NextResponse(buildIntermediaryHtml(oauthUrl), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Chrome/normal browser: standard 302 redirect (works fine)
    return NextResponse.redirect(oauthUrl, 302);
  } catch (error: unknown) {
    console.error('Mobile signin error:', error);
    return NextResponse.redirect(
      `${BASE_URL}/login?error=MobileSigninFailed`,
      302
    );
  }
}
