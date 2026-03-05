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
  {
    id: 'flashcards',
    label: 'Study Mode',
    title: 'AI Flashcards & Spaced Repetition',
    description:
      'Turn your knowledge base into study material. AI generates flashcards from your content and schedules reviews using spaced repetition — so you remember what matters.',
    bullets: [
      'AI-generated flashcards from your notes and links',
      'Spaced repetition with SM-2 algorithm',
      'Track mastery with per-card confidence ratings',
    ],
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    title: 'Knowledge Marketplace',
    description:
      'Discover and clone curated knowledge collections from the community. Share your own expertise and grow your reach — a viral loop for collective learning.',
    bullets: [
      'Browse and clone public knowledge collections',
      'Publish your own curated collections',
      'Category tags, ratings, and clone counts',
    ],
  },
  {
    id: 'badges',
    label: 'Badges',
    title: 'Gamification & Badges',
    description:
      'Stay motivated with achievements that reward consistent learning. Earn badges for streaks, milestones, and mastery — from bronze to gold tier.',
    bullets: [
      'Bronze, silver, and gold tier badges',
      'Streak tracking and milestone rewards',
      'Progress bars show how close you are to the next unlock',
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

function FlashcardsMockup() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Card 3 of 12
        </span>
        <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
          8 mastered
        </span>
      </div>
      <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-4 text-center min-h-[80px] flex flex-col items-center justify-center">
        <span className="text-[10px] font-medium text-muted-foreground mb-1">Question</span>
        <span className="text-sm font-medium">What is spaced repetition?</span>
      </div>
      <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/5 p-4 text-center min-h-[60px] flex flex-col items-center justify-center">
        <span className="text-[10px] font-medium text-muted-foreground mb-1">Answer</span>
        <span className="text-xs text-muted-foreground">A learning technique that increases intervals between reviews as mastery improves.</span>
      </div>
      <div className="flex gap-2">
        {[
          { label: 'Again', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
          { label: 'Hard', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
          { label: 'Easy', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
        ].map((btn) => (
          <span key={btn.label} className={`flex-1 rounded-lg border px-2 py-1.5 text-center text-xs font-medium ${btn.color}`}>
            {btn.label}
          </span>
        ))}
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">Progress</span>
          <span className="text-[10px] font-medium text-muted-foreground">67%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted">
          <div className="h-1.5 rounded-full bg-primary" style={{ width: '67%' }} />
        </div>
      </div>
    </div>
  );
}

function MarketplaceMockup() {
  const collections = [
    { title: 'Web Dev Essentials', author: 'sarah_dev', clones: 342, tags: ['javascript', 'react'] },
    { title: 'ML Research Papers', author: 'ai_researcher', clones: 128, tags: ['machine-learning', 'papers'] },
    { title: 'Design Systems Guide', author: 'ux_craft', clones: 256, tags: ['design', 'ui/ux'] },
  ];
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium">Trending Collections</span>
        <span className="text-[10px] text-muted-foreground">1,200+ public</span>
      </div>
      <div className="space-y-2.5">
        {collections.map((c) => (
          <div key={c.title} className="rounded-lg border border-border/30 bg-muted/30 p-3">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-xs font-medium block">{c.title}</span>
                <span className="text-[10px] text-muted-foreground">by {c.author}</span>
              </div>
              <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                Clone
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {c.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
              <span className="ml-auto text-[10px] text-muted-foreground">{c.clones} clones</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BadgesMockup() {
  const badges = [
    { name: 'First Capture', tier: 'gold', icon: '🏆', progress: 100, unlocked: true },
    { name: '7-Day Streak', tier: 'silver', icon: '🔥', progress: 100, unlocked: true },
    { name: '100 Notes', tier: 'bronze', icon: '📝', progress: 73, unlocked: false },
    { name: 'Knowledge Guru', tier: 'gold', icon: '🧠', progress: 45, unlocked: false },
  ];
  const tierColors: Record<string, string> = {
    gold: 'border-yellow-500/30 bg-yellow-500/5',
    silver: 'border-gray-400/30 bg-gray-400/5',
    bronze: 'border-orange-600/30 bg-orange-600/5',
  };
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium">Your Badges</span>
        <span className="text-[10px] font-medium text-primary">2 of 4 unlocked</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {badges.map((b) => (
          <div
            key={b.name}
            className={`rounded-lg border p-3 text-center ${tierColors[b.tier]} ${!b.unlocked ? 'opacity-60' : ''}`}
          >
            <span className="text-2xl block mb-1">{b.icon}</span>
            <span className="text-[11px] font-medium block">{b.name}</span>
            <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground capitalize">
              {b.tier}
            </span>
            {!b.unlocked && (
              <div className="mt-1.5">
                <div className="h-1 rounded-full bg-muted">
                  <div className="h-1 rounded-full bg-primary/60" style={{ width: `${b.progress}%` }} />
                </div>
                <span className="text-[9px] text-muted-foreground mt-0.5 block">{b.progress}%</span>
              </div>
            )}
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
  flashcards: FlashcardsMockup,
  marketplace: MarketplaceMockup,
  badges: BadgesMockup,
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
