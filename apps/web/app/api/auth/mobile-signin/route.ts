import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// This endpoint handles OAuth initiation for mobile/Capacitor apps.
// It serves an HTML page that auto-submits the Auth.js signin form via POST.
// This is needed because Auth.js requires POST with CSRF token for signin.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const callbackUrl = url.searchParams.get('callbackUrl') || '/dashboard';
  const authUrl = process.env.AUTH_URL || 'https://mindweave.space';

  // First, fetch the CSRF token from Auth.js
  const csrfResponse = await fetch(`${authUrl}/api/auth/csrf`, {
    headers: { cookie: (await cookies()).toString() },
  });
  const csrfData = await csrfResponse.json();
  const csrfToken = csrfData.csrfToken;

  // Return an HTML page that auto-submits the signin form
  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Signing in...</title></head>
    <body>
      <p>Redirecting to Google Sign-In...</p>
      <form id="signin-form" method="POST" action="${authUrl}/api/auth/signin/google">
        <input type="hidden" name="csrfToken" value="${csrfToken}" />
        <input type="hidden" name="callbackUrl" value="${callbackUrl}" />
      </form>
      <script>document.getElementById('signin-form').submit();</script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
