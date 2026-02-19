'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Home,
  PlusCircle,
  Search,
  Library,
  MessageCircleQuestion,
  Upload,
  BarChart3,
  User,
  Sun,
  Moon,
  Monitor,
  CheckSquare,
  Clock,
  FileText,
  Link2,
  File,
  Keyboard,
  type LucideIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { getContentAction } from '@/app/actions/content';
import { useRecentPages, type RecentPage } from '@/hooks/useRecentPages';

const iconMap: Record<string, LucideIcon> = {
  Home,
  PlusCircle,
  Search,
  Library,
  MessageCircleQuestion,
  Upload,
  BarChart3,
  User,
  CheckSquare,
};

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, shortcut: 'H' },
  { href: '/dashboard/capture', label: 'Capture', icon: PlusCircle, shortcut: 'N' },
  { href: '/dashboard/import', label: 'Import', icon: Upload, shortcut: 'I' },
  { href: '/dashboard/search', label: 'Search', icon: Search, shortcut: 'S' },
  { href: '/dashboard/ask', label: 'Ask AI', icon: MessageCircleQuestion, shortcut: 'A' },
  { href: '/dashboard/library', label: 'Library', icon: Library, shortcut: 'L' },
  { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare, shortcut: 'T' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, shortcut: 'Y' },
  { href: '/dashboard/profile', label: 'Profile', icon: User, shortcut: 'P' },
];

const typeIcons: Record<string, LucideIcon> = {
  note: FileText,
  link: Link2,
  file: File,
};

interface ContentResult {
  id: string;
  title: string;
  type: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [contentResults, setContentResults] = useState<ContentResult[]>([]);
  const [searching, setSearching] = useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();
  const { recentPages } = useRecentPages();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Toggle with Cmd/Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Reset state when closing
  useEffect(() => {
    if (!open) {
      setQuery('');
      setContentResults([]);
      setSearching(false);
    }
  }, [open]);

  // Debounced content search
  const searchContent = useCallback(async (q: string) => {
    if (q.length < 2) {
      setContentResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const result = await getContentAction({ query: q, limit: 5 });
      if (result.success) {
        setContentResults(
          result.items.map((item) => ({
            id: item.id,
            title: item.title,
            type: item.type,
          }))
        );
      }
    } catch {
      setContentResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setContentResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      searchContent(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchContent]);

  const runCommand = (cmd: () => void) => {
    setOpen(false);
    cmd();
  };

  const getRecentPageIcon = (page: RecentPage): LucideIcon => {
    return iconMap[page.icon] || Home;
  };

  const groupHeadingClass =
    '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground';
  const itemClass =
    'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent';

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      className="fixed inset-0 z-[100]"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      {/* Dialog */}
      <div className="fixed left-1/2 top-[20%] z-[101] w-full max-w-lg -translate-x-1/2 rounded-xl border bg-popover shadow-soft-lg overflow-hidden animate-scale-in">
        <Command.Input
          placeholder="Type a command or search..."
          value={query}
          onValueChange={setQuery}
          className="w-full border-b bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            No results found.
          </Command.Empty>

          {/* Recent Pages */}
          {recentPages.length > 0 && (
            <>
              <Command.Group heading="Recent" className={groupHeadingClass}>
                {recentPages.map((page) => {
                  const Icon = getRecentPageIcon(page);
                  return (
                    <Command.Item
                      key={`recent-${page.href}`}
                      value={`Recent ${page.label}`}
                      onSelect={() => runCommand(() => router.push(page.href))}
                      className={itemClass}
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">{page.label}</span>
                      <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
                    </Command.Item>
                  );
                })}
              </Command.Group>
              <Command.Separator className="my-1 h-px bg-border" />
            </>
          )}

          {/* Content Search Results */}
          {query.length >= 2 && (
            <>
              <Command.Group heading="Content" className={groupHeadingClass}>
                {searching ? (
                  <div className="px-3 py-2.5 text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : contentResults.length > 0 ? (
                  contentResults.map((item) => {
                    const TypeIcon = typeIcons[item.type] || FileText;
                    return (
                      <Command.Item
                        key={`content-${item.id}`}
                        value={`Content ${item.title}`}
                        onSelect={() =>
                          runCommand(() =>
                            router.push(
                              `/dashboard/library?q=${encodeURIComponent(item.title)}`
                            )
                          )
                        }
                        className={itemClass}
                      >
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 truncate">{item.title}</span>
                        <span className="text-[10px] rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                          {item.type}
                        </span>
                      </Command.Item>
                    );
                  })
                ) : (
                  <div className="px-3 py-2.5 text-sm text-muted-foreground">
                    No content found.
                  </div>
                )}
              </Command.Group>
              <Command.Separator className="my-1 h-px bg-border" />
            </>
          )}

          {/* Navigation */}
          <Command.Group heading="Navigation" className={groupHeadingClass}>
            {navItems.map((item) => (
              <Command.Item
                key={item.href}
                value={item.label}
                onSelect={() => runCommand(() => router.push(item.href))}
                className={itemClass}
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{item.label}</span>
                <kbd className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground font-mono">
                  {item.shortcut}
                </kbd>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Separator className="my-1 h-px bg-border" />

          {/* Actions */}
          <Command.Group heading="Actions" className={groupHeadingClass}>
            <Command.Item
              value="New Note"
              onSelect={() => runCommand(() => router.push('/dashboard/capture'))}
              className={itemClass}
            >
              <PlusCircle className="h-4 w-4 text-muted-foreground" />
              New Note
            </Command.Item>
            <Command.Item
              value="Search Knowledge"
              onSelect={() => runCommand(() => router.push('/dashboard/search'))}
              className={itemClass}
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              Search Knowledge
            </Command.Item>
            <Command.Item
              value="Ask AI"
              onSelect={() => runCommand(() => router.push('/dashboard/ask'))}
              className={itemClass}
            >
              <MessageCircleQuestion className="h-4 w-4 text-muted-foreground" />
              Ask AI
            </Command.Item>
            <Command.Item
              value="Keyboard Shortcuts"
              onSelect={() =>
                runCommand(() => window.dispatchEvent(new CustomEvent('open-help')))
              }
              className={itemClass}
            >
              <Keyboard className="h-4 w-4 text-muted-foreground" />
              Keyboard Shortcuts
            </Command.Item>
          </Command.Group>

          <Command.Separator className="my-1 h-px bg-border" />

          {/* Theme */}
          <Command.Group heading="Theme" className={groupHeadingClass}>
            <Command.Item
              value="Light Mode"
              onSelect={() => runCommand(() => setTheme('light'))}
              className={itemClass}
            >
              <Sun className="h-4 w-4 text-muted-foreground" />
              Light Mode
            </Command.Item>
            <Command.Item
              value="Dark Mode"
              onSelect={() => runCommand(() => setTheme('dark'))}
              className={itemClass}
            >
              <Moon className="h-4 w-4 text-muted-foreground" />
              Dark Mode
            </Command.Item>
            <Command.Item
              value="System Theme"
              onSelect={() => runCommand(() => setTheme('system'))}
              className={itemClass}
            >
              <Monitor className="h-4 w-4 text-muted-foreground" />
              System
            </Command.Item>
          </Command.Group>
        </Command.List>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t px-4 py-2 text-[11px] text-muted-foreground">
          <span>
            <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">↑↓</kbd>{' '}
            Navigate
          </span>
          <span>
            <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">↵</kbd>{' '}
            Select
          </span>
          <span>
            <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">Esc</kbd>{' '}
            Close
          </span>
        </div>
      </div>
    </Command.Dialog>
  );
}
