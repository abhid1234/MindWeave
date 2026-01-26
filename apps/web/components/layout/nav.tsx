'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, Search, Library, MessageCircleQuestion, Upload, BarChart3 } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/capture', label: 'Capture', icon: PlusCircle },
  { href: '/dashboard/import', label: 'Import', icon: Upload },
  { href: '/dashboard/search', label: 'Search', icon: Search },
  { href: '/dashboard/ask', label: 'Ask AI', icon: MessageCircleQuestion },
  { href: '/dashboard/library', label: 'Library', icon: Library },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
];

interface NavLinksProps {
  onNavigate?: () => void;
}

export function NavLinks({ onNavigate }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            {/* Active indicator */}
            <span
              className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-primary transition-all duration-200 ${
                isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
              aria-hidden="true"
            />
            <Icon
              className={`h-4 w-4 transition-all duration-200 ${
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground group-hover:scale-110'
              }`}
            />
            <span className="transition-colors duration-200">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default function Nav() {
  return (
    <nav className="hidden w-64 border-r bg-muted/20 p-4 lg:block">
      <NavLinks />
    </nav>
  );
}
