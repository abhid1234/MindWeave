'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbulb } from 'lucide-react';
import { DiscoverSection } from './DiscoverSection';
import { DiscoverCard } from './DiscoverCard';
import { getUnexploredTopicsAction } from '@/app/actions/discover';
import type { DiscoverResult } from '@/app/actions/discover';

export function UnexploredTopics() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<DiscoverResult[]>([]);

  useEffect(() => {
    let cancelled = false;

    getUnexploredTopicsAction(8)
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
      title="Unexplored topics"
      description="Content with tags you haven't been reading about lately"
      icon={Lightbulb}
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
