'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { DiscoverSection } from './DiscoverSection';
import { DiscoverCard } from './DiscoverCard';
import { getRediscoverAction } from '@/app/actions/discover';
import type { DiscoverResult } from '@/app/actions/discover';

export function RediscoverContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<DiscoverResult[]>([]);

  useEffect(() => {
    let cancelled = false;

    getRediscoverAction(8)
      .then((response) => {
        if (cancelled) return;
        if (response.success) {
          setResults(response.results);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return (
    <DiscoverSection
      title="Rediscover"
      description="Older content you haven't looked at in a while"
      icon={RotateCcw}
      isLoading={isLoading}
      isEmpty={results.length === 0}
    >
      {results.map((item) => (
        <DiscoverCard
          key={item.id}
          {...item}
          onClick={() => router.push(`/dashboard/library?highlight=${item.id}`)}
        />
      ))}
    </DiscoverSection>
  );
}
