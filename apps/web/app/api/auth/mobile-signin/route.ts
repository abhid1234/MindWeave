import { redirect } from 'next/navigation';
import { signIn } from '@/lib/auth';

// This endpoint handles OAuth initiation for mobile/Capacitor apps
// It allows a GET request to trigger the OAuth flow (normally requires POST with CSRF)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const callbackUrl = url.searchParams.get('callbackUrl') || '/dashboard';

  // Trigger the OAuth flow - this will redirect to Google
  await signIn('google', { redirectTo: callbackUrl });
}
