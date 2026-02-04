'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { findBreadcrumbs } from './docs-nav-config';

export function DocsBreadcrumbs() {
  const pathname = usePathname();
  const crumbs = findBreadcrumbs(pathname);

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />}
              {isLast ? (
                <span className="font-medium text-foreground">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
