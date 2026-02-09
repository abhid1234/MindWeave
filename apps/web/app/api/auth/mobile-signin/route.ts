import { NextResponse } from 'next/server';

// This endpoint handles OAuth initiation for mobile/Capacitor apps.
// It serves an HTML page that fetches a CSRF token client-side (so the cookie is set
// in the browser), then auto-submits the Auth.js signin form via POST.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const callbackUrl = url.searchParams.get('callbackUrl') || '/dashboard';
  const authUrl = process.env.AUTH_URL || 'https://mindweave.space';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Signing in...</title></head>
    <body>
      <p>Redirecting to Google Sign-In...</p>
      <form id="signin-form" method="POST" action="${authUrl}/api/auth/signin/google">
        <input type="hidden" name="csrfToken" id="csrf-token" value="" />
        <input type="hidden" name="callbackUrl" value="${callbackUrl}" />
      </form>
      <script>
        // Fetch CSRF token client-side so the cookie is set in this browser context
        fetch('${authUrl}/api/auth/csrf', { credentials: 'include' })
          .then(r => r.json())
          .then(data => {
            document.getElementById('csrf-token').value = data.csrfToken;
            document.getElementById('signin-form').submit();
          })
          .catch(err => {
            document.body.innerHTML = '<p>Error: ' + err.message + '</p>';
          });
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
