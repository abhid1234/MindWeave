'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';
import { DiscoverSection } from './DiscoverSection';
import { DiscoverCard } from './DiscoverCard';
import { getActivityBasedRecommendationsAction } from '@/app/actions/discover';
import type { DiscoverResult } from '@/app/actions/discover';

export function ActivityRecommendations() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<DiscoverResult[]>([]);

  useEffect(() => {
    let cancelled = false;

    getActivityBasedRecommendationsAction(8)
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
      title="Based on your activity"
      description="Recommendations based on what you've been reading recently"
      icon={Activity}
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
