import Link from 'next/link';
import Image from 'next/image';
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
    <header className="border-border/50 bg-background/80 supports-[backdrop-filter]:bg-background/60 dark:border-border/30 dark:bg-background/70 sticky top-0 z-50 border-b backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <MobileNav />
          <Link
            href="/dashboard"
            className="hover:text-primary group flex items-center gap-2 text-xl font-bold tracking-tight transition-colors"
          >
            <Image
              src="/icons/icon.svg"
              alt="Mindweave logo"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span className="text-gradient">Mindweave</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <kbd className="bg-muted text-muted-foreground pointer-events-none hidden h-7 select-none items-center gap-1 rounded border px-2 font-mono text-[10px] font-medium sm:inline-flex">
            <span className="text-xs">⌘</span>K
          </kbd>
          <ThemeToggle />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
