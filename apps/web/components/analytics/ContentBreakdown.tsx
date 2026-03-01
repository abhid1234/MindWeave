'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getContentTypeBreakdownAction } from '@/app/actions/analytics';
import type { ContentTypeBreakdown } from '@/types/analytics';

const COLORS = {
  notes: '#3b82f6', // blue
  links: '#22c55e', // green
  files: '#a855f7', // purple
};

export function ContentBreakdown() {
  const [data, setData] = useState<ContentTypeBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await getContentTypeBreakdownAction();
        if (result.success && result.data) {
          setData(result.data);
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return <div className="h-[350px] animate-pulse rounded-lg bg-muted" data-testid="content-breakdown-skeleton" />;
  }

  if (!data) return null;

  const total = data.notes + data.links + data.files;

  if (total === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChartIcon className="h-5 w-5 text-primary" />
            Content Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">
            No content yet. Start capturing to see your breakdown.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    { name: 'Notes', value: data.notes, color: COLORS.notes },
    { name: 'Links', value: data.links, color: COLORS.links },
    { name: 'Files', value: data.files, color: COLORS.files },
  ].filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <PieChartIcon className="h-5 w-5 text-primary" />
          Content Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <PieChart width={300} height={260}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [value, 'Items']}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--popover))',
                color: 'hsl(var(--popover-foreground))',
              }}
            />
            <Legend />
          </PieChart>
        </div>
        <div className="text-center text-sm text-muted-foreground">
          {total} total items
        </div>
      </CardContent>
    </Card>
  );
}
