import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { DocsHeader } from '@/components/docs/DocsHeader';
import { DocsBreadcrumbs } from '@/components/docs/DocsBreadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata = {
  title: {
    template: '%s | Mindweave Docs',
    default: 'Mindweave Docs',
  },
  description: 'Documentation for Mindweave — your AI-powered personal knowledge hub.',
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Docs',
      item: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/docs`,
    },
  ],
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <div className="bg-background min-h-screen">
        {/* Mobile header */}
        <DocsHeader />

        <div className="container mx-auto flex max-w-6xl">
          {/* Desktop sidebar */}
          <aside className="hidden w-64 flex-shrink-0 border-r lg:block">
            <div className="scrollbar-thin sticky top-0 h-screen overflow-y-auto px-4 py-6">
              <div className="mb-6">
                <Link href="/docs" className="text-gradient text-xl font-bold">
                  Mindweave Docs
                </Link>
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-foreground mt-2 inline-flex items-center gap-1 text-xs transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to app
                </Link>
              </div>
              <DocsSidebar />
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
            <DocsBreadcrumbs />
            <div className="prose prose-neutral dark:prose-invert max-w-none">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
