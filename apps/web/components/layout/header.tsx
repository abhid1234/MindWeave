import Image from 'next/image';
import Link from 'next/link';
import { signOutAction } from '@/app/actions/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { MobileNav } from './MobileNav';
import { Button } from '@/components/ui/button';

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

          {/* User info - desktop */}
          <div className="hidden items-center gap-3 sm:flex">
            {user.image && (
              <div className="relative">
                <Image
                  src={user.image}
                  alt={user.name || 'User'}
                  width={36}
                  height={36}
                  className="rounded-full ring-2 ring-border transition-all hover:ring-primary/50"
                  priority
                />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
              </div>
            )}
            <div className="text-sm">
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* User avatar - mobile */}
          {user.image && (
            <div className="relative sm:hidden">
              <Image
                src={user.image}
                alt={user.name || 'User'}
                width={32}
                height={32}
                className="rounded-full ring-2 ring-border"
                priority
              />
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
            </div>
          )}

          <form action={signOutAction}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="text-sm"
            >
              <span className="hidden sm:inline">Sign Out</span>
              <span className="sm:hidden">Exit</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
