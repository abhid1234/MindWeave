import { NextResponse } from 'next/server';

// This endpoint handles OAuth initiation for mobile/Capacitor apps.
// It fetches a CSRF token server-side, passes both the cookie and token to the browser,
// then auto-submits the Auth.js signin form via POST.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const callbackUrl = url.searchParams.get('callbackUrl') || '/dashboard';
  const authUrl = process.env.AUTH_URL || 'https://mindweave.space';

  // Fetch CSRF token from Auth.js (server-side, same origin)
  const csrfResponse = await fetch(`${authUrl}/api/auth/csrf`);
  const csrfData = await csrfResponse.json();
  const csrfToken = csrfData.csrfToken;

  // Extract Set-Cookie headers from the CSRF response
  // getSetCookie() returns individual cookie strings
  let csrfCookies: string[] = [];
  if (typeof csrfResponse.headers.getSetCookie === 'function') {
    csrfCookies = csrfResponse.headers.getSetCookie();
  } else {
    // Fallback: get raw set-cookie header
    const raw = csrfResponse.headers.get('set-cookie');
    if (raw) {
      // Split on comma followed by a cookie name pattern (not inside expires date)
      csrfCookies = raw.split(/,(?=\s*(?:__Host-|__Secure-|[a-zA-Z]))/);
    }
  }

  const html = `<!DOCTYPE html>
<html>
<head><title>Signing in...</title></head>
<body>
<p>Redirecting to Google Sign-In...</p>
<form id="f" method="POST" action="${authUrl}/api/auth/signin/google">
<input type="hidden" name="csrfToken" value="${csrfToken}" />
<input type="hidden" name="callbackUrl" value="${callbackUrl}" />
</form>
<script>document.getElementById('f').submit();</script>
</body>
</html>`;

  // Create response with HTML and forward CSRF cookies to browser
  const response = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });

  // Forward each cookie from the CSRF response
  for (const cookie of csrfCookies) {
    response.headers.append('Set-Cookie', cookie);
  }

  return response;
}
