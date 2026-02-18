'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface Shortcut {
  key: string;
  label: string;
  description: string;
  category: 'General' | 'Navigation';
}

export const shortcuts: Shortcut[] = [
  { key: 'Ctrl+K', label: 'Ctrl+K', description: 'Open command palette', category: 'General' },
  { key: '?', label: '?', description: 'Show keyboard shortcuts', category: 'General' },
  { key: 'H', label: 'H', description: 'Go to Dashboard', category: 'Navigation' },
  { key: 'N', label: 'N', description: 'New Capture', category: 'Navigation' },
  { key: 'S', label: 'S', description: 'Search', category: 'Navigation' },
  { key: 'L', label: 'L', description: 'Library', category: 'Navigation' },
  { key: 'A', label: 'A', description: 'Ask AI', category: 'Navigation' },
];

export function useKeyboardShortcuts(onOpenHelp: () => void) {
  const router = useRouter();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip when modifier keys are held (except for Ctrl+K which is handled by CommandPalette)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Skip when typing in inputs, textareas, contenteditable, or cmdk input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        target.closest('[cmdk-input]')
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          router.push('/dashboard/capture');
          break;
        case 's':
          e.preventDefault();
          router.push('/dashboard/search');
          break;
        case 'h':
          e.preventDefault();
          router.push('/dashboard');
          break;
        case 'l':
          e.preventDefault();
          router.push('/dashboard/library');
          break;
        case 'a':
          e.preventDefault();
          router.push('/dashboard/ask');
          break;
        case '?':
          e.preventDefault();
          onOpenHelp();
          break;
      }
    },
    [router, onOpenHelp],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}
