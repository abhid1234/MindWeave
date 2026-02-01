import Link from 'next/link';
import { MobileNav } from './MobileNav';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <MobileNav />
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 text-xl font-bold tracking-tight transition-colors hover:text-primary"
          >
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Mindweave
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <kbd className="pointer-events-none hidden h-7 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
            <span className="text-xs">⌘</span>K
          </kbd>
          <ThemeToggle />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
