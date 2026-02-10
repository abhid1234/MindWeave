import crypto from 'crypto';

/**
 * Create a signed one-time token for mobile OAuth callback.
 * Used to transfer authentication from Chrome to the app's WebView.
 * Token expires in 2 minutes.
 */
export function createMobileAuthToken(userId: string, email: string): string {
  const payload = JSON.stringify({
    sub: userId,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 120,
  });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', process.env.AUTH_SECRET!)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${signature}`;
}

/**
 * Verify a signed mobile auth token.
 * Returns user info if valid, null if invalid or expired.
 */
export function verifyMobileAuthToken(token: string): { sub: string; email: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, signature] = parts;

    const expectedSig = crypto
      .createHmac('sha256', process.env.AUTH_SECRET!)
      .update(payloadB64)
      .digest('base64url');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
