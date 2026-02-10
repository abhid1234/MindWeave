import { auth } from '@/lib/auth';
import { createMobileAuthToken } from '@/lib/mobile-auth';

// After Google OAuth completes in Chrome, this endpoint:
// 1. Reads the session (user is authenticated in Chrome's cookie context)
// 2. Creates a signed one-time token containing the user ID
// 3. Redirects to mindweave:// custom scheme so Android catches it
// 4. The Android app then exchanges the token for a WebView session
export async function GET() {
  const session = await auth();

  if (!session?.user?.id || !session?.user?.email) {
    return new Response(
      `<!DOCTYPE html><html><body>
        <p>Authentication failed. <a href="https://mindweave.space/login">Return to login</a></p>
      </body></html>`,
      { status: 401, headers: { 'Content-Type': 'text/html' } }
    );
  }

  const token = createMobileAuthToken(session.user.id, session.user.email);
  const redirectUrl = `mindweave://auth?token=${encodeURIComponent(token)}`;

  // Use HTML+JS redirect because HTTP 302 to custom schemes may not work in all browsers
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting...</title></head>
<body><p>Signing you in...</p>
<script>window.location.href=${JSON.stringify(redirectUrl)};</script>
<noscript><a href="${redirectUrl}">Tap here to open the app</a></noscript>
</body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}
