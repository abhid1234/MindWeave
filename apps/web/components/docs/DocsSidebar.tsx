'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { docsNavConfig } from './docs-nav-config';

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Documentation" className="space-y-6">
      {docsNavConfig.map((section) => (
        <div key={section.label}>
          <h4 className="mb-2 text-sm font-semibold text-foreground">
            {section.label}
          </h4>
          <ul className="space-y-1">
            {section.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'block rounded-md px-3 py-1.5 text-sm transition-colors',
                    pathname === item.href
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
