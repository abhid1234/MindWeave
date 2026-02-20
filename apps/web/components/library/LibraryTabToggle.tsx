'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Library, FolderOpen } from 'lucide-react';

export type LibraryTab = 'items' | 'collections';

export function LibraryTabToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get('tab') as LibraryTab) || 'items';

  const handleTabChange = (tab: LibraryTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'items') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
      // Clear collectionId when switching to collections view
      params.delete('collectionId');
    }
    router.push(`/dashboard/library${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const tabs = [
    { value: 'items' as const, icon: Library, label: 'All Items' },
    { value: 'collections' as const, icon: FolderOpen, label: 'Collections' },
  ];

  return (
    <div className="flex gap-2">
      {tabs.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => handleTabChange(value)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            currentTab === value
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
          aria-pressed={currentTab === value}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
