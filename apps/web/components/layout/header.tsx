import Image from 'next/image';
import Link from 'next/link';
import { signOutAction } from '@/app/actions/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { MobileNav } from './MobileNav';

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <MobileNav />
          <Link href="/dashboard" className="text-xl font-bold">
            Mindweave
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <div className="hidden items-center gap-3 sm:flex">
            {user.image && (
              <Image
                src={user.image}
                alt={user.name || 'User'}
                width={32}
                height={32}
                className="rounded-full"
                priority
              />
            )}
            <div className="text-sm">
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          {user.image && (
            <Image
              src={user.image}
              alt={user.name || 'User'}
              width={32}
              height={32}
              className="rounded-full sm:hidden"
              priority
            />
          )}

          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent"
            >
              <span className="hidden sm:inline">Sign Out</span>
              <span className="sm:hidden">Exit</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
