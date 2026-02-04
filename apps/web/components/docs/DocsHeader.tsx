import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DocsMobileNav } from './DocsMobileNav';

export function DocsHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <DocsMobileNav />
          <Link
            href="/docs"
            className="text-lg font-bold text-gradient"
          >
            Mindweave Docs
          </Link>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to app
        </Link>
      </div>
    </header>
  );
}
