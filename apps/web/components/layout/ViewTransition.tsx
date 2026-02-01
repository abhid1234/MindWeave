'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function ViewTransition() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      // The transition is triggered; CSS handles the animation
      (document as unknown as { startViewTransition: (cb: () => Promise<void>) => void }).startViewTransition(() => {
        // Navigation already happened via Next.js router
        return Promise.resolve();
      });
    }
  }, [pathname]);

  return null;
}
