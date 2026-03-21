'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/tracker';

interface SignupBannerProps {
  userCount: number;
}

const COOKIE_NAME = 'mw_banner_dismissed';
const COOKIE_TTL_DAYS = 7;

function getBannerDismissedCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${COOKIE_NAME}=`));
}

function setBannerDismissedCookie(): void {
  const expires = new Date();
  expires.setDate(expires.getDate() + COOKIE_TTL_DAYS);
  document.cookie = `${COOKIE_NAME}=1; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

export function SignupBanner({ userCount }: SignupBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getBannerDismissedCookie()) {
      setVisible(true);
    }
  }, []);

  function handleDismiss() {
    setBannerDismissedCookie();
    setVisible(false);
  }

  function handleSignupClick() {
    trackEvent('cta_click', { location: 'signup_banner', destination: '/auth/register' });
  }

  if (!visible) return null;

  return (
    <div
      className="bg-primary text-primary-foreground fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-4 py-3 shadow-lg"
      role="banner"
      aria-label="Sign up prompt"
    >
      <p className="text-sm font-medium">
        Join {userCount.toLocaleString()}+ knowledge builders on Mindweave
      </p>
      <div className="flex items-center gap-2">
        <Link
          href="/auth/register"
          onClick={handleSignupClick}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium transition-colors"
        >
          Sign Up Free
        </Link>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          className="hover:bg-primary-foreground/20 rounded p-1 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
