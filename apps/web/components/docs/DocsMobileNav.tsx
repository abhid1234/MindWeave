'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { docsNavConfig } from './docs-nav-config';

export function DocsMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle docs menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Documentation Menu</SheetTitle>
        <div className="border-b px-6 py-4">
          <Link
            href="/docs"
            onClick={() => setOpen(false)}
            className="text-xl font-bold text-gradient"
          >
            Mindweave Docs
          </Link>
        </div>
        <div className="overflow-y-auto p-4 scrollbar-thin">
          <nav aria-label="Documentation mobile" className="space-y-6">
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
                        onClick={() => setOpen(false)}
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
