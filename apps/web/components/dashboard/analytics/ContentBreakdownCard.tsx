'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ContentBreakdownCardProps {
  contentTypeStats: {
    type: string;
    count: number;
  }[];
  totalItems: number;
}

const COLORS = ['#6366f1', '#8b5cf6'];

export function ContentBreakdownCard({
  contentTypeStats,
  totalItems,
}: ContentBreakdownCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contentTypeStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="type"
                >
                  {contentTypeStats.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {contentTypeStats.map((stat, index) => (
              <div
                key={stat.type}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {stat.type}
                  </span>
                </div>
                <span className="text-sm font-medium">{stat.count}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-sm font-medium">Total</span>
              <span className="text-sm font-medium">{totalItems} total items</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
