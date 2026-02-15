'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { getTagDistributionAction } from '@/app/actions/analytics';
import type { TagDistributionData } from '@/types/analytics';

const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
];

export function TagDistributionChart() {
  const [data, setData] = useState<TagDistributionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getTagDistributionAction();
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
    <div className="rounded-lg border bg-card p-6 shadow-sm" data-testid="tag-distribution-chart">
      <h3 className="mb-4 text-lg font-semibold">Tag Distribution</h3>

      {isLoading ? (
        <div className="flex h-[300px] items-center justify-center" data-testid="chart-loading">
          <Skeleton className="h-full w-full" />
        </div>
      ) : error ? (
        <div className="flex h-[300px] items-center justify-center text-destructive" data-testid="chart-error">
          {error}
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-[300px] flex-col items-center justify-center text-muted-foreground" data-testid="chart-empty">
          <p>No tags found</p>
          <p className="mt-1 text-sm">Add tags to your content to see distribution</p>
        </div>
      ) : (
        <div className="h-[300px]" data-testid="chart-content">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="40%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="count"
                nameKey="tag"
                label={false}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.tag}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | string, name: string) => [`${value} items`, name]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                formatter={(value: string) => {
                  const item = data.find((d) => d.tag === value);
                  return (
                    <span className="text-sm text-foreground">
                      {value} ({item?.percentage ?? 0}%)
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
