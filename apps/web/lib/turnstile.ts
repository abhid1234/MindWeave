const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    // SECURITY: In production, missing key must fail closed to prevent bypass
    if (process.env.NODE_ENV === 'production') {
      console.error('TURNSTILE_SECRET_KEY not set in production — rejecting request');
      return false;
    }
    // Skip verification only in development
    console.warn('TURNSTILE_SECRET_KEY not set — skipping Turnstile verification (dev only)');
    return true;
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch {
    console.error('Turnstile verification request failed');
    return false;
  }
}
