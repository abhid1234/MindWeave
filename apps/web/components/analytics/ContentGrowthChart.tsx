'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getContentGrowthAction } from '@/app/actions/analytics';
import type { ContentGrowthData, GrowthPeriod } from '@/types/analytics';

interface ContentGrowthChartProps {
  initialPeriod?: GrowthPeriod;
}

const CHART_COLORS = {
  notes: '#3b82f6', // blue
  links: '#10b981', // green
  files: '#f59e0b', // amber
};

export function ContentGrowthChart({ initialPeriod = 'month' }: ContentGrowthChartProps) {
  const [data, setData] = useState<ContentGrowthData[]>([]);
  const [period, setPeriod] = useState<GrowthPeriod>(initialPeriod);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getContentGrowthAction(period);
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
  }, [period]);

  const formatDate = (dateStr: string) => {
    if (period === 'year') {
      // Format as "Jan", "Feb", etc.
      const [year, month] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
    // Format as "1/15", "1/16", etc.
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm" data-testid="content-growth-chart">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Content Growth</h3>
        <div className="flex gap-1">
          {(['week', 'month', 'year'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
              data-testid={`period-${p}`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[300px] items-center justify-center" data-testid="chart-loading">
          <Skeleton className="h-full w-full" />
        </div>
      ) : error ? (
        <div className="flex h-[300px] items-center justify-center text-destructive" data-testid="chart-error">
          {error}
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-muted-foreground" data-testid="chart-empty">
          No data available for this period
        </div>
      ) : (
        <div className="h-[300px]" data-testid="chart-content">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip
                labelFormatter={(value: string | number) => {
                  const dateStr = String(value);
                  if (period === 'year') {
                    const [year, month] = dateStr.split('-');
                    const date = new Date(parseInt(year), parseInt(month) - 1);
                    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  }
                  return new Date(dateStr).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  });
                }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="notes"
                name="Notes"
                stroke={CHART_COLORS.notes}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="links"
                name="Links"
                stroke={CHART_COLORS.links}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="files"
                name="Files"
                stroke={CHART_COLORS.files}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
