'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'mindweave:recent-pages';
const MAX_PAGES = 5;

export interface RecentPage {
  href: string;
  label: string;
  icon: string; // lucide icon name
}

function loadPages(): RecentPage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePages(pages: RecentPage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  } catch {
    // localStorage full or unavailable
  }
}

export function useRecentPages() {
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    setRecentPages(loadPages());
  }, []);

  const addPage = useCallback((href: string, label: string, icon: string) => {
    setRecentPages((prev) => {
      const filtered = prev.filter((p) => p.href !== href);
      const updated = [{ href, label, icon }, ...filtered].slice(0, MAX_PAGES);
      savePages(updated);
      return updated;
    });
  }, []);

  return { recentPages, addPage };
}
