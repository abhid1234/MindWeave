import { Metadata } from 'next';
import { ExternalLink, PenLine } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Blog - Mindweave',
  description:
    'Thoughts on building Mindweave, AI-powered knowledge management, and personal productivity.',
  alternates: {
    canonical: 'https://www.mindweave.space/blog',
  },
  openGraph: {
    title: 'Blog - Mindweave',
    description:
      'Thoughts on building Mindweave, AI-powered knowledge management, and personal productivity.',
    url: 'https://www.mindweave.space/blog',
    siteName: 'Mindweave',
    type: 'website',
    images: ['https://www.mindweave.space/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog - Mindweave',
    description:
      'Thoughts on building Mindweave, AI-powered knowledge management, and personal productivity.',
  },
};

const posts = [
  {
    title: 'I Built an AI-Powered Second Brain',
    date: '2026-02-15',
    summary:
      'How I built Mindweave — an AI-powered personal knowledge hub with semantic search, auto-tagging, and knowledge Q&A.',
    url: 'https://abhid.substack.com/p/i-built-an-ai-powered-second-brain',
  },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const jsonLdData = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Blog - Mindweave',
  description:
    'Thoughts on building Mindweave, AI-powered knowledge management, and personal productivity.',
  url: 'https://www.mindweave.space/blog',
};

export default function BlogPage() {
  return (
    <>
      <JsonLd data={jsonLdData} />
      <div className="bg-background min-h-screen">
        <div className="container mx-auto max-w-3xl px-4 py-16">
          {/* Heading */}
          <div className="animate-fade-up" style={{ animationFillMode: 'backwards' }}>
            <div className="mb-3 flex items-center gap-3">
              <div className="bg-primary/10 inline-flex rounded-lg p-2.5">
                <PenLine className="text-primary h-5 w-5" />
              </div>
              <h1 className="text-4xl font-bold">Blog</h1>
            </div>
            <p className="text-muted-foreground mb-12">
              Thoughts on building Mindweave, AI-powered knowledge management, and personal
              productivity.
            </p>
          </div>

          {/* Post list */}
          <div className="space-y-6">
            {posts.map((post, index) => (
              <article
                key={post.url}
                className="bg-card animate-fade-up hover:shadow-soft-md hover:border-primary/20 rounded-xl border p-6 transition-all duration-300 hover:-translate-y-0.5"
                style={{ animationDelay: `${75 + index * 75}ms`, animationFillMode: 'backwards' }}
              >
                <time
                  dateTime={post.date}
                  className="text-muted-foreground text-xs font-medium uppercase tracking-wide"
                >
                  {formatDate(post.date)}
                </time>
                <h2 className="mb-2 mt-2 text-xl font-semibold">{post.title}</h2>
                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">{post.summary}</p>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                >
                  Read on Substack
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </article>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
