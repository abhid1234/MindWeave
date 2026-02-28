'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { Zap, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { getConnectionsAction } from '@/app/actions/connections';
import { ConnectionCard } from '@/components/connections/ConnectionCard';
import type { ConnectionResult } from '@/types/connections';

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<ConnectionResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const { addToast } = useToast();

  const loadConnections = useCallback(() => {
    startTransition(async () => {
      const result = await getConnectionsAction(5);
      if (result.success && result.data) {
        setConnections(result.data);
      } else {
        addToast({ title: result.message || 'Failed to load connections', variant: 'error' });
      }
      setLoaded(true);
    });
  }, [addToast]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Connect the Dots</h1>
              <p className="text-muted-foreground">
                Discover unexpected connections in your knowledge
              </p>
            </div>
          </div>
          <button
            onClick={loadConnections}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="mb-6 animate-fade-up rounded-lg border border-border bg-muted/40 px-5 py-4 text-sm text-muted-foreground" style={{ animationDelay: '50ms', animationFillMode: 'backwards' }}>
        <p className="mb-2 font-medium text-foreground">How it works</p>
        <p>
          Connect the Dots uses AI to find surprising links between items in your knowledge base that
          don&apos;t share any tags but are semantically related. The more diverse content you capture — across
          different topics — the more unexpected insights you&apos;ll discover. Each connection comes with an
          AI-generated explanation you can share as a LinkedIn post.
        </p>
      </div>

      {/* Content */}
      <div className="animate-fade-up space-y-4" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
        {isPending && !loaded ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <p className="text-sm text-muted-foreground">Finding cross-domain connections...</p>
          </div>
        ) : connections.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Zap className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <h2 className="mt-4 text-lg font-semibold">No connections found yet</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Add more content with diverse topics to discover unexpected connections. The AI looks for items with moderate similarity but no overlapping tags.
            </p>
          </div>
        ) : (
          connections.map((conn) => (
            <ConnectionCard key={conn.id} connection={conn} />
          ))
        )}
      </div>
    </div>
  );
}
