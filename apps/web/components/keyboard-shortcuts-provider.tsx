'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRecentPages } from '@/hooks/useRecentPages';
import { KeyboardShortcutsHelp } from '@/components/ui/keyboard-shortcuts-help';

const pathLabelMap: Record<string, { label: string; icon: string }> = {
  '/dashboard': { label: 'Dashboard', icon: 'Home' },
  '/dashboard/capture': { label: 'Capture', icon: 'PlusCircle' },
  '/dashboard/import': { label: 'Import', icon: 'Upload' },
  '/dashboard/search': { label: 'Search', icon: 'Search' },
  '/dashboard/ask': { label: 'Ask AI', icon: 'MessageCircleQuestion' },
  '/dashboard/library': { label: 'Library', icon: 'Library' },
  '/dashboard/tasks': { label: 'Tasks', icon: 'CheckSquare' },
  '/dashboard/analytics': { label: 'Analytics', icon: 'BarChart3' },
  '/dashboard/profile': { label: 'Profile', icon: 'User' },
};

export function KeyboardShortcutsProvider() {
  const [helpOpen, setHelpOpen] = useState(false);
  const pathname = usePathname();
  const { addPage } = useRecentPages();

  const openHelp = useCallback(() => setHelpOpen(true), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);

  useKeyboardShortcuts(openHelp);

  // Listen for open-help event from command palette
  useEffect(() => {
    const handler = () => setHelpOpen(true);
    window.addEventListener('open-help', handler);
    return () => window.removeEventListener('open-help', handler);
  }, []);

  // Track recent pages on route change
  useEffect(() => {
    const info = pathLabelMap[pathname];
    if (info) {
      addPage(pathname, info.label, info.icon);
    }
  }, [pathname, addPage]);

  return <KeyboardShortcutsHelp open={helpOpen} onClose={closeHelp} />;
}
