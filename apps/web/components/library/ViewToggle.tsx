'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, List, Columns3 } from 'lucide-react';

const views = [
  { value: 'grid', icon: LayoutGrid, label: 'Grid view' },
  { value: 'list', icon: List, label: 'List view' },
  { value: 'board', icon: Columns3, label: 'Board view' },
] as const;

export type ViewMode = 'grid' | 'list' | 'board';

export function ViewToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = (searchParams.get('view') as ViewMode) || 'grid';

  const handleViewChange = (view: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === 'grid') {
      params.delete('view');
    } else {
      params.set('view', view);
    }
    router.push(`/dashboard/library${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className="flex gap-1">
      {views.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => handleViewChange(value)}
          className={`rounded-lg p-2 text-sm transition-colors ${
            currentView === value
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
          aria-label={label}
          aria-pressed={currentView === value}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
