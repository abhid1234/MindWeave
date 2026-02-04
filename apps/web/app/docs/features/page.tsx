import Link from 'next/link';
import { Bookmark, FolderOpen, Tags, Search, MessageSquare, BarChart3 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features Overview',
  description: 'Overview of all Mindweave features for capturing, organizing, and rediscovering knowledge.',
};

const features = [
  {
    title: 'Content Capture',
    description:
      'Save notes, bookmark links, and upload files. Mindweave supports multiple content types so you can store any kind of knowledge in one place.',
    href: '/docs/features/capture',
    icon: Bookmark,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  },
  {
    title: 'Content Library',
    description:
      'Browse, filter, and sort your entire knowledge base. Use powerful filtering by content type, tags, and date ranges to find what you need.',
    href: '/docs/features/library',
    icon: FolderOpen,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    title: 'Tagging',
    description:
      'Organize with manual tags and let AI auto-tag your content. Mindweave uses Google Gemini to suggest relevant tags automatically.',
    href: '/docs/features/tagging',
    icon: Tags,
    color: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
  },
  {
    title: 'Search',
    description:
      'Find anything with full-text keyword search or AI-powered semantic search that understands meaning, not just exact words.',
    href: '/docs/features/search',
    icon: Search,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  {
    title: 'Knowledge Q&A',
    description:
      'Ask natural language questions about your knowledge base and get accurate, sourced answers powered by RAG and Google Gemini.',
    href: '/docs/features/ask',
    icon: MessageSquare,
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  },
  {
    title: 'Analytics',
    description:
      'Track your knowledge growth with dashboards showing content metrics, tag distributions, and usage patterns over time.',
    href: '/docs/features/analytics',
    icon: BarChart3,
    color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
  },
];

export default function FeaturesOverviewPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold mb-3">Features</h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Mindweave combines powerful organization tools with AI capabilities to help you
          build and navigate your personal knowledge base effortlessly.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="group spotlight-card rounded-xl border bg-card p-6 transition-all duration-300 hover:shadow-soft-md hover:-translate-y-0.5 hover:border-primary/20"
          >
            <div className={`inline-flex rounded-xl p-3 border mb-4 ${feature.color}`}>
              <feature.icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </Link>
        ))}
      </section>

      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-xl font-semibold mb-3">Collections</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Group related content into curated collections for easy access and organization.
          Collections let you create topic-based bundles of notes, links, and files.
        </p>
        <Link href="/docs/features/collections" className="text-primary hover:underline text-sm font-medium">
          Learn about collections &rarr;
        </Link>
      </section>
    </div>
  );
}
