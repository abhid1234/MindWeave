import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { DocsHeader } from '@/components/docs/DocsHeader';
import { DocsBreadcrumbs } from '@/components/docs/DocsBreadcrumbs';

export const metadata = {
  title: {
    template: '%s | Mindweave Docs',
    default: 'Mindweave Docs',
  },
  description: 'Documentation for Mindweave — your AI-powered personal knowledge hub.',
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <DocsHeader />

      <div className="container mx-auto flex max-w-6xl">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 border-r">
          <div className="sticky top-0 h-screen overflow-y-auto scrollbar-thin py-6 px-4">
            <div className="mb-6">
              <Link href="/docs" className="text-xl font-bold text-gradient">
                Mindweave Docs
              </Link>
              <Link
                href="/"
                className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to app
              </Link>
            </div>
            <DocsSidebar />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
          <DocsBreadcrumbs />
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
