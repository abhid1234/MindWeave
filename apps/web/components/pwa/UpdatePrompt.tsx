'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UpdatePrompt() {
  const [showReload, setShowReload] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
              setShowReload(true);
            }
          });
        });
      });

      // Handle controller change (when new SW takes over)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowReload(false);
  };

  const handleDismiss = () => {
    setShowReload(false);
  };

  if (!showReload) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border bg-background p-4 shadow-lg">
      <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium">Update Available</p>
        <p className="text-xs text-muted-foreground">
          A new version of Mindweave is available. Refresh to update.
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleUpdate}>
            Refresh
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss}>
            Later
          </Button>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="shrink-0 rounded-sm opacity-70 hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
