'use client';

import { useState, useEffect } from 'react';
import { Eye, Copy, Store } from 'lucide-react';
import { getMarketplaceStatsAction } from '@/app/actions/marketplace';
import type { MarketplaceCreatorStats } from '@/types/marketplace';

export function MarketplaceStats() {
  const [stats, setStats] = useState<MarketplaceCreatorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const result = await getMarketplaceStatsAction();
      if (result.success && result.stats) {
        setStats(result.stats);
      }
      setIsLoading(false);
    }
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted" />
        ))}
      </div>
    );
  }

  if (!stats || stats.totalListings === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Marketplace</h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center">
          <Store className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-lg font-semibold">{stats.totalListings}</p>
          <p className="text-xs text-muted-foreground">Listed</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <Eye className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-lg font-semibold">{stats.totalViews}</p>
          <p className="text-xs text-muted-foreground">Views</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <Copy className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-lg font-semibold">{stats.totalClones}</p>
          <p className="text-xs text-muted-foreground">Clones</p>
        </div>
      </div>
    </div>
  );
}
