'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { useTheme } from 'next-themes';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();

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

  const runCommand = (cmd: () => void) => {
    setOpen(false);
    cmd();
  };

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
          className="w-full border-b bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            No results found.
          </Command.Empty>

          <Command.Group heading="Navigation" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
            {[
              { href: '/dashboard', label: 'Dashboard', icon: Home },
              { href: '/dashboard/capture', label: 'Capture', icon: PlusCircle },
              { href: '/dashboard/import', label: 'Import', icon: Upload },
              { href: '/dashboard/search', label: 'Search', icon: Search },
              { href: '/dashboard/ask', label: 'Ask AI', icon: MessageCircleQuestion },
              { href: '/dashboard/library', label: 'Library', icon: Library },
              { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
              { href: '/dashboard/profile', label: 'Profile', icon: User },
            ].map((item) => (
              <Command.Item
                key={item.href}
                value={item.label}
                onSelect={() => runCommand(() => router.push(item.href))}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                {item.label}
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Separator className="my-1 h-px bg-border" />

          <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
            <Command.Item
              value="New Note"
              onSelect={() => runCommand(() => router.push('/dashboard/capture'))}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
            >
              <PlusCircle className="h-4 w-4 text-muted-foreground" />
              New Note
            </Command.Item>
            <Command.Item
              value="Search Knowledge"
              onSelect={() => runCommand(() => router.push('/dashboard/search'))}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              Search Knowledge
            </Command.Item>
            <Command.Item
              value="Ask AI"
              onSelect={() => runCommand(() => router.push('/dashboard/ask'))}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
            >
              <MessageCircleQuestion className="h-4 w-4 text-muted-foreground" />
              Ask AI
            </Command.Item>
          </Command.Group>

          <Command.Separator className="my-1 h-px bg-border" />

          <Command.Group heading="Theme" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
            <Command.Item
              value="Light Mode"
              onSelect={() => runCommand(() => setTheme('light'))}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
            >
              <Sun className="h-4 w-4 text-muted-foreground" />
              Light Mode
            </Command.Item>
            <Command.Item
              value="Dark Mode"
              onSelect={() => runCommand(() => setTheme('dark'))}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
            >
              <Moon className="h-4 w-4 text-muted-foreground" />
              Dark Mode
            </Command.Item>
            <Command.Item
              value="System Theme"
              onSelect={() => runCommand(() => setTheme('system'))}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
            >
              <Monitor className="h-4 w-4 text-muted-foreground" />
              System
            </Command.Item>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
