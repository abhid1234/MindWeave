'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
      Plugins?: {
        App?: {
          openUrl: (options: { url: string }) => Promise<{ completed: boolean }>;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  authUrl: string;
}

export function GoogleSignInButton({ authUrl }: GoogleSignInButtonProps) {
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    // Detect if running in Capacitor
    setIsCapacitor(
      typeof window !== 'undefined' &&
      window.Capacitor?.isNativePlatform?.() === true
    );
  }, []);

  const handleClick = async (e: React.MouseEvent) => {
    if (isCapacitor) {
      e.preventDefault();

      // Open OAuth URL in external browser
      // Construct the full OAuth URL
      const oauthUrl = `${authUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(authUrl + '/dashboard')}`;

      // Try using Capacitor App plugin
      if (window.Capacitor?.Plugins?.App?.openUrl) {
        try {
          await window.Capacitor.Plugins.App.openUrl({ url: oauthUrl });
          return;
        } catch (err) {
          console.error('Failed to open URL via Capacitor:', err);
        }
      }

      // Fallback: open in new window (which should trigger external browser)
      window.open(oauthUrl, '_system');
    }
    // If not Capacitor, let the form submit normally
  };

  return (
    <button
      type={isCapacitor ? 'button' : 'submit'}
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Continue with Google
    </button>
  );
}
