'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, Search, Library, MessageCircleQuestion } from 'lucide-react';

const items = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/search', label: 'Search', icon: Search },
  { href: '/dashboard/capture', label: 'Capture', icon: PlusCircle },
  { href: '/dashboard/ask', label: 'Ask AI', icon: MessageCircleQuestion },
  { href: '/dashboard/library', label: 'Library', icon: Library },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md lg:hidden safe-bottom">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isCapture = item.href === '/dashboard/capture';

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors ${
                isCapture
                  ? 'text-primary'
                  : isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  isCapture
                    ? 'bg-primary text-primary-foreground'
                    : isActive
                      ? 'bg-primary/10'
                      : ''
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
