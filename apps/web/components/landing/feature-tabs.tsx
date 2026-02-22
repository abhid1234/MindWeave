'use client';

import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

interface TabData {
  id: string;
  label: string;
  title: string;
  description: string;
  bullets: string[];
}

const tabs: TabData[] = [
  {
    id: 'capture',
    label: 'Capture',
    title: 'Quick Capture',
    description:
      'Save notes, links, and files in seconds. Paste a URL, type a thought, or drop a file — Mindweave handles the rest. One interface for all your knowledge.',
    bullets: [
      'Notes, links, and file uploads',
      'Auto-extracts titles and metadata from URLs',
      'Capture from web, Chrome extension, or Android',
    ],
  },
  {
    id: 'tagging',
    label: 'AI Tagging',
    title: 'AI Auto-Tagging',
    description:
      'Stop spending time manually organizing. Gemini AI reads your content, understands context, and assigns relevant tags automatically. Your knowledge organizes itself.',
    bullets: [
      'Powered by Google Gemini AI',
      'Understands context, not just keywords',
      'Generates vector embeddings for semantic search',
    ],
  },
  {
    id: 'search',
    label: 'Semantic Search',
    title: 'Semantic Search',
    description:
      'Search by meaning, not just keywords. Ask "that article about productivity systems" and find it — even if those words never appeared in the content. Powered by pgvector.',
    bullets: [
      'Finds conceptually similar content',
      'Combined keyword + vector search',
      'Results ranked by semantic relevance',
    ],
  },
  {
    id: 'qa',
    label: 'Knowledge Q&A',
    title: 'Knowledge Q&A',
    description:
      'Ask questions and get answers sourced from your personal knowledge base. Like ChatGPT, but it only knows what you know — with citations back to your original content.',
    bullets: [
      'RAG-powered answers from your content',
      'Citations link back to source material',
      'Conversational follow-up questions',
    ],
  },
  {
    id: 'library',
    label: 'Smart Library',
    title: 'Smart Library',
    description:
      'Browse, filter, and rediscover everything you have saved. Filter by type, tags, or date. Sort by relevance or recency. Your personal knowledge at a glance.',
    bullets: [
      'Filter by content type, tags, and date',
      'Grid and list view options',
      'Bulk actions and tag management',
    ],
  },
];

function CaptureMockup() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-soft">
      <div className="mb-4 flex gap-2">
        {['Note', 'Link', 'File'].map((type) => (
          <span
            key={type}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              type === 'Note'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {type}
          </span>
        ))}
      </div>
      <div className="mb-3 rounded-lg border border-border/50 bg-muted/50 px-3 py-2">
        <span className="text-sm text-foreground">Meeting notes — Q1 planning</span>
      </div>
      <div className="rounded-lg border border-border/50 bg-muted/50 px-3 py-2 h-20">
        <span className="text-xs text-muted-foreground">
          Key decisions from today&apos;s meeting: 1) Launch MVP by March. 2) Focus on semantic
          search as differentiator. 3) Chrome extension priority...
        </span>
      </div>
      <div className="mt-3 flex justify-end">
        <span className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground">
          Save
        </span>
      </div>
    </div>
  );
}

function TaggingMockup() {
  const tags = ['productivity', 'planning', 'Q1-goals', 'meeting-notes', 'strategy'];
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-blue-500" />
        <span className="text-sm font-medium">Meeting notes — Q1 planning</span>
      </div>
      <div className="mb-3 text-xs text-muted-foreground leading-relaxed">
        Key decisions from today&apos;s meeting: Launch MVP by March, focus on semantic search...
      </div>
      <div className="border-t border-border/50 pt-3">
        <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          AI-Generated Tags
        </span>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span
              key={tag}
              className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 animate-fade-in"
              style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'both' }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchMockup() {
  const results = [
    { title: 'Productivity frameworks comparison', type: 'note', match: '92%' },
    { title: 'Deep Work by Cal Newport', type: 'link', match: '87%' },
    { title: 'Time-blocking strategy guide', type: 'note', match: '81%' },
  ];
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-soft">
      <div className="mb-4 rounded-lg border border-border/50 bg-muted/50 px-3 py-2 flex items-center gap-2">
        <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="text-sm text-foreground">How do I improve my productivity?</span>
      </div>
      <div className="space-y-2">
        {results.map((r) => (
          <div
            key={r.title}
            className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/30 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  r.type === 'note' ? 'bg-yellow-500' : 'bg-green-500'
                }`}
              />
              <span className="text-xs font-medium">{r.title}</span>
            </div>
            <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
              {r.match}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QAMockup() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-soft">
      <div className="space-y-3">
        <div className="ml-auto max-w-[80%] rounded-xl rounded-br-sm bg-primary px-3 py-2">
          <span className="text-xs text-primary-foreground">
            What were the key decisions from last week?
          </span>
        </div>
        <div className="mr-auto max-w-[85%] rounded-xl rounded-bl-sm border border-border/50 bg-muted/50 px-3 py-2">
          <span className="text-xs text-foreground leading-relaxed">
            Based on your notes, the key decisions were: 1) Launch MVP by March, 2) Prioritize
            semantic search, 3) Chrome extension next.
          </span>
          <div className="mt-2 border-t border-border/30 pt-1.5">
            <span className="text-[10px] text-muted-foreground">
              Sources: Meeting notes — Q1 planning, Roadmap draft
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LibraryMockup() {
  const filters = ['All', 'Notes', 'Links', 'Files'];
  const cards = [
    { title: 'Q1 Planning', type: 'note', color: 'bg-yellow-500' },
    { title: 'Cal Newport article', type: 'link', color: 'bg-green-500' },
    { title: 'Design mockups', type: 'file', color: 'bg-purple-500' },
    { title: 'API architecture', type: 'note', color: 'bg-yellow-500' },
  ];
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-soft">
      <div className="mb-3 flex gap-1.5">
        {filters.map((f) => (
          <span
            key={f}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              f === 'All'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {f}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {cards.map((c) => (
          <div key={c.title} className="rounded-lg border border-border/30 bg-muted/30 p-2.5">
            <div className="mb-1.5 flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${c.color}`} />
              <span className="text-[10px] font-medium text-muted-foreground capitalize">
                {c.type}
              </span>
            </div>
            <span className="text-xs font-medium leading-tight">{c.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const mockups: Record<string, () => React.JSX.Element> = {
  capture: CaptureMockup,
  tagging: TaggingMockup,
  search: SearchMockup,
  qa: QAMockup,
  library: LibraryMockup,
};

export function FeatureTabs() {
  const [activeTab, setActiveTab] = useState('capture');

  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                See how it <span className="text-gradient">works</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Click a feature to explore it in detail.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
              <Tabs.List className="mb-8 flex overflow-x-auto border-b border-border/50 scrollbar-none">
                {tabs.map((tab) => (
                  <Tabs.Trigger
                    key={tab.id}
                    value={tab.id}
                    className={`shrink-0 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-foreground border-b-2 border-primary -mb-px'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>

              {tabs.map((tab) => {
                const Mockup = mockups[tab.id];
                return (
                  <Tabs.Content key={tab.id} value={tab.id} className="animate-fade-in">
                    <div className="grid gap-8 lg:grid-cols-[45%_55%] items-start">
                      <div className="order-2 lg:order-1">
                        <h3 className="text-2xl font-bold mb-3">{tab.title}</h3>
                        <p className="text-muted-foreground leading-relaxed mb-5">
                          {tab.description}
                        </p>
                        <ul className="space-y-2.5 mb-6">
                          {tab.bullets.map((bullet) => (
                            <li key={bullet} className="flex items-start gap-2.5">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                              <span className="text-sm text-muted-foreground">{bullet}</span>
                            </li>
                          ))}
                        </ul>
                        <Link
                          href="/login"
                          className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                        >
                          Try it free
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                      <div className="order-1 lg:order-2">
                        <Mockup />
                      </div>
                    </div>
                  </Tabs.Content>
                );
              })}
            </Tabs.Root>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
