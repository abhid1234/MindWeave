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
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function Nav() {
  return (
    <nav className="hidden w-64 border-r bg-muted/30 p-4 lg:block">
      <NavLinks />
    </nav>
  );
}
