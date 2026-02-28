'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { getCollectionUsageAction } from '@/app/actions/analytics';
import type { CollectionUsageData } from '@/types/analytics';

const DEFAULT_COLOR = '#3b82f6';

export function CollectionUsageChart() {
  const [data, setData] = useState<CollectionUsageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getCollectionUsageAction();
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.message || 'Failed to load data');
        }
      } catch {
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm" data-testid="collection-usage-chart">
      <h3 className="mb-4 text-lg font-semibold">Collection Usage</h3>

      {isLoading ? (
        <div className="flex h-[300px] items-center justify-center" data-testid="chart-loading">
          <Skeleton className="h-full w-full" />
        </div>
      ) : error ? (
        <div className="flex h-[300px] items-center justify-center text-destructive" data-testid="chart-error">
          {error}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground" data-testid="chart-empty">
          <p>No collections yet</p>
          <p className="mt-1 text-sm">Create collections to organize your content</p>
        </div>
      ) : (
        <div className="h-[300px]" data-testid="chart-content">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                width={100}
              />
              <Tooltip
                formatter={(value: number) => [`${value} item${value !== 1 ? 's' : ''}`, 'Items']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Bar dataKey="itemCount" radius={[0, 4, 4, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.id} fill={entry.color || DEFAULT_COLOR} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
