'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, ChevronRight } from 'lucide-react';

const segmentLabels: Record<string, string> = {
  capture: 'Capture',
  library: 'Library',
  search: 'Search',
  ask: 'Ask AI',
  analytics: 'Analytics',
  import: 'Import',
  profile: 'Profile',
};

export function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === '/dashboard') return null;

  const segments = pathname.replace('/dashboard/', '').split('/');
  const label = segmentLabels[segments[0]] || segments[0];

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link href="/dashboard" className="hover:text-foreground transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-3.5 w-3.5" />
      <span className="text-foreground font-medium">{label}</span>
    </nav>
  );
}
