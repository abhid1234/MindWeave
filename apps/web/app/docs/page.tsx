import Link from 'next/link';
import { BookOpen, Lightbulb, Search, MessageSquare, FolderOpen, BarChart3, Bookmark, Tags } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'Learn how to use Mindweave to capture, organize, and rediscover your knowledge.',
};

const quickLinks = [
  {
    title: 'Content Capture',
    description: 'Save notes, links, and files to your knowledge base.',
    href: '/docs/features/capture',
    icon: Bookmark,
  },
  {
    title: 'Smart Tagging',
    description: 'Organize content with manual and AI-powered tags.',
    href: '/docs/features/tagging',
    icon: Tags,
  },
  {
    title: 'Search',
    description: 'Find anything with keyword and semantic search.',
    href: '/docs/features/search',
    icon: Search,
  },
  {
    title: 'Knowledge Q&A',
    description: 'Ask questions and get answers from your knowledge base.',
    href: '/docs/features/ask',
    icon: MessageSquare,
  },
  {
    title: 'Collections',
    description: 'Group related content into curated collections.',
    href: '/docs/features/collections',
    icon: FolderOpen,
  },
  {
    title: 'Analytics',
    description: 'Track your knowledge growth and usage patterns.',
    href: '/docs/features/analytics',
    icon: BarChart3,
  },
];

export default function DocsPage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section>
        <h1 className="text-4xl font-bold mb-3">Mindweave Documentation</h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Mindweave is an AI-powered personal knowledge hub that helps you capture, organize,
          and rediscover your ideas, notes, bookmarks, and learnings. This documentation covers
          everything you need to get started and make the most of Mindweave.
        </p>
      </section>

      {/* Quick start CTA */}
      <section className="rounded-xl border bg-primary/5 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-1">New to Mindweave?</h2>
            <p className="text-muted-foreground mb-3">
              Start with the getting started guide to create your account and save your first piece of knowledge.
            </p>
            <Link
              href="/docs/getting-started"
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors btn-press"
            >
              <Lightbulb className="h-4 w-4" />
              Getting Started
            </Link>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Explore Features</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group spotlight-card rounded-xl border bg-card p-5 transition-all duration-300 hover:shadow-soft-md hover:-translate-y-0.5 hover:border-primary/20"
            >
              <div className="inline-flex rounded-lg p-2 bg-primary/10 border border-primary/20 mb-3">
                <link.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold mb-1">{link.title}</h3>
              <p className="text-sm text-muted-foreground">{link.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Additional links */}
      <section className="border-t pt-8">
        <h2 className="text-2xl font-semibold mb-4">More Resources</h2>
        <ul className="space-y-2">
          <li>
            <Link href="/docs/account" className="text-primary hover:underline">
              Account &amp; Settings
            </Link>
            <span className="text-muted-foreground"> — Manage your profile, security, and preferences.</span>
          </li>
          <li>
            <Link href="/docs/faq" className="text-primary hover:underline">
              FAQ
            </Link>
            <span className="text-muted-foreground"> — Answers to commonly asked questions.</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
