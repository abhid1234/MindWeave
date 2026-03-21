import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  Github,
  BookOpen,
  Brain,
  Sparkles,
  Search,
  Smartphone,
  Chrome,
  Globe,
  Microscope,
  Terminal,
  GraduationCap,
  PenTool,
  Briefcase,
  Lightbulb,
  Star,
  Check,
  X,
  Mic,
  Camera,
  Link2,
  Bell,
  Webhook,
  BarChart3,
  Newspaper,
  History,
  Key,
  Users,
  Zap,
  Layout,
} from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { FeatureTabs } from '@/components/landing/feature-tabs';
import { CommandPaletteShowcase } from '@/components/landing/command-palette-showcase';
import { SocialProofCounters } from '@/components/growth/SocialProofCounters';
import { getSocialProofStats } from '@/app/actions/social-proof';

export const metadata: Metadata = {
  title: 'Mindweave - AI-Powered Personal Knowledge Hub',
  description:
    'Stop losing your best ideas. Capture notes, links, and files — AI auto-tags, organizes, and lets you search by meaning. Open source.',
};

const steps = [
  {
    number: '1',
    title: 'Capture anything',
    subtitle: 'Notes, links, files.',
    description: "Type a thought, paste a URL, or drop a file. One click and it's saved.",
    icon: BookOpen,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    cardBg: 'bg-blue-500/5',
    cardBorder: 'border-blue-500/15',
  },
  {
    number: '2',
    title: 'AI does the rest',
    subtitle: 'Tags, summaries, embeddings.',
    description: 'Gemini auto-tags, summarizes, and creates vector embeddings. Zero manual work.',
    icon: Brain,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    cardBg: 'bg-purple-500/5',
    cardBorder: 'border-purple-500/15',
  },
  {
    number: '3',
    title: 'Find it instantly',
    subtitle: 'Search by meaning.',
    description:
      'Semantic search finds related ideas, not just keyword matches. Or just ask a question.',
    icon: Search,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    cardBg: 'bg-green-500/5',
    cardBorder: 'border-green-500/15',
  },
  {
    number: '4',
    title: 'Never forget again',
    subtitle: 'Your second brain.',
    description:
      'Every idea resurfaces when you need it. Recommendations, clusters, and insights — all automatic.',
    icon: Sparkles,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    cardBg: 'bg-orange-500/5',
    cardBorder: 'border-orange-500/15',
  },
];

const useCases = [
  {
    icon: Microscope,
    title: 'Researchers',
    scenario: 'From papers to breakthroughs',
    description:
      'Organize papers, notes, and findings. Ask questions across your entire research corpus.',
    bullets: [
      'Save PDFs & annotate highlights',
      'Ask questions across your entire corpus',
      'Auto-tag by methodology, topic, and field',
    ],
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    cardBg: 'bg-blue-500/5',
    cardBorder: 'border-blue-500/15',
  },
  {
    icon: Terminal,
    title: 'Developers',
    scenario: 'Your personal Stack Overflow',
    description:
      'Save code snippets, docs, and Stack Overflow answers. Semantic search finds the right solution fast.',
    bullets: [
      'Save code snippets, docs & error fixes',
      'Semantic search finds the right solution fast',
      'Never re-Google the same problem twice',
    ],
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    cardBg: 'bg-green-500/5',
    cardBorder: 'border-green-500/15',
  },
  {
    icon: GraduationCap,
    title: 'Students',
    scenario: 'Study smarter, not harder',
    description:
      'Capture lecture notes, readings, and study materials. AI-powered review when exams hit.',
    bullets: [
      'Capture lecture notes & reading highlights',
      'AI flashcards with spaced repetition for exams',
      'Organize by course, semester, and topic',
    ],
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    cardBg: 'bg-purple-500/5',
    cardBorder: 'border-purple-500/15',
  },
  {
    icon: PenTool,
    title: 'Content Creators',
    scenario: 'From inspiration to publication',
    description:
      'Bookmark inspiration, draft ideas, and resurface references when creating new content.',
    bullets: [
      'Bookmark references, images & quotes',
      'Resurface the perfect example when creating',
      'Track ideas from spark to finished piece',
    ],
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    cardBg: 'bg-orange-500/5',
    cardBorder: 'border-orange-500/15',
  },
  {
    icon: Briefcase,
    title: 'Professionals',
    scenario: 'Never lose institutional knowledge',
    description:
      'Track meeting notes, decisions, and project knowledge. Never lose institutional memory.',
    bullets: [
      'Track meeting notes & key decisions',
      'Share curated knowledge with your team',
      'Search across months of project history',
    ],
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    cardBg: 'bg-emerald-500/5',
    cardBorder: 'border-emerald-500/15',
  },
  {
    icon: Lightbulb,
    title: 'Lifelong Learners',
    scenario: 'Build your second brain',
    description:
      'Save articles, podcasts, and book highlights. Build a personal knowledge base that grows with you.',
    bullets: [
      'Save articles, podcasts & book highlights',
      'Connect ideas across disciplines',
      'Grow a knowledge base that compounds over time',
    ],
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    cardBg: 'bg-yellow-500/5',
    cardBorder: 'border-yellow-500/15',
  },
];

const comparisonFeatures = [
  {
    feature: 'Semantic search (by meaning)',
    mindweave: 'yes',
    notion: 'no',
    evernote: 'no',
    obsidian: 'plugin',
  },
  {
    feature: 'AI auto-tagging',
    mindweave: 'yes',
    notion: 'no',
    evernote: 'no',
    obsidian: 'no',
  },
  {
    feature: 'Knowledge Q&A (RAG)',
    mindweave: 'yes',
    notion: 'limited',
    evernote: 'no',
    obsidian: 'plugin',
  },
  {
    feature: 'Open source / self-host',
    mindweave: 'yes',
    notion: 'no',
    evernote: 'no',
    obsidian: 'yes',
  },
  {
    feature: 'Free tier',
    mindweave: 'yes',
    notion: 'yes',
    evernote: 'limited',
    obsidian: 'yes',
  },
  {
    feature: 'Browser extension',
    mindweave: 'yes',
    notion: 'yes',
    evernote: 'yes',
    obsidian: 'no',
  },
  {
    feature: 'Vector embeddings',
    mindweave: 'yes',
    notion: 'no',
    evernote: 'no',
    obsidian: 'no',
  },
  {
    feature: 'AI Flashcards & Spaced Repetition',
    mindweave: 'yes',
    notion: 'no',
    evernote: 'no',
    obsidian: 'plugin',
  },
  {
    feature: 'Gamification & Badges',
    mindweave: 'yes',
    notion: 'no',
    evernote: 'no',
    obsidian: 'no',
  },
  {
    feature: 'Knowledge Marketplace',
    mindweave: 'yes',
    notion: 'no',
    evernote: 'no',
    obsidian: 'plugin',
  },
  {
    feature: 'Embeddable Knowledge Cards',
    mindweave: 'yes',
    notion: 'no',
    evernote: 'no',
    obsidian: 'no',
  },
];

const techNames = [
  'Next.js 15',
  'TypeScript',
  'PostgreSQL',
  'pgvector',
  'Tailwind CSS',
  'Auth.js',
  'Drizzle ORM',
  'Gemini AI',
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'Mindweave',
      url: 'https://www.mindweave.space',
      description:
        'AI-powered personal knowledge hub. Capture notes, links, and files — AI auto-tags, organizes, and lets you search by meaning.',
      publisher: {
        '@type': 'Organization',
        name: 'Mindweave',
        url: 'https://www.mindweave.space',
      },
    },
    {
      '@type': 'WebApplication',
      name: 'Mindweave',
      url: 'https://www.mindweave.space',
      description:
        'Stop losing your best ideas. Capture notes, links, and files — AI auto-tags, organizes, and lets you search by meaning. Open source.',
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        'AI Auto-Tagging',
        'Semantic Search',
        'Knowledge Q&A',
        'Quick Capture',
        'Smart Library',
        'Chrome Extension',
        'AI Flashcards',
        'Knowledge Marketplace',
        'Gamification & Badges',
        'Collaborative Collections',
        'TIL Public Feed',
        'Voice Capture & OCR',
      ],
      screenshot: 'https://www.mindweave.space/opengraph-image',
    },
  ],
};

function ComparisonCell({ value }: { value: string }) {
  if (value === 'yes') {
    return <Check className="mx-auto h-5 w-5 text-green-500" />;
  }
  if (value === 'no') {
    return <X className="mx-auto h-5 w-5 text-red-400/60" />;
  }
  return (
    <span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize">
      {value}
    </span>
  );
}

export default async function Home() {
  const [session, stats] = await Promise.all([auth(), getSocialProofStats()]);

  if (session?.user) {
    redirect('/dashboard');
  }

  let gitHubStars = '50+';
  try {
    const res = await fetch('https://api.github.com/repos/abhid1234/MindWeave', {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      gitHubStars = (data.stargazers_count || 0).toLocaleString();
    }
  } catch {
    /* use fallback */
  }

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="glass glass-dark border-border/50 sticky top-0 z-50 border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <span className="text-gradient flex items-center gap-2 text-2xl font-bold">
            <Image
              src="/icons/icon.svg"
              alt="Mindweave logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            Mindweave
          </span>
          <div className="flex items-center gap-6">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground hidden text-sm font-medium transition-colors sm:inline-block"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-muted-foreground hover:text-foreground hidden text-sm font-medium transition-colors sm:inline-block"
            >
              How It Works
            </a>
            <Link
              href="/docs"
              className="text-muted-foreground hover:text-foreground hidden text-sm font-medium transition-colors sm:inline-block"
            >
              Docs
            </Link>
            <Link
              href="/login"
              className="bg-primary text-primary-foreground hover:bg-primary/90 btn-press rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1" tabIndex={-1}>
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Background effects */}
          <div className="from-primary/5 to-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent" />
          <div className="bg-primary/5 pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full blur-3xl" />
          {/* Dot grid pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="container relative mx-auto px-4 py-24 sm:py-32 lg:py-40">
            <div className="animate-fade-up mx-auto max-w-4xl text-center">
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl">
                Your AI-Powered
                <br />
                <span className="from-primary bg-gradient-to-r via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Second Brain
                </span>
              </h1>
              <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-8 sm:text-xl lg:text-2xl">
                Capture notes, links, and files — AI auto-tags, organizes, and lets you search by
                meaning so you never lose a great idea again.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/auth/register"
                  className="bg-primary text-primary-foreground group inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-base font-semibold shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                >
                  Start Free — No Credit Card
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="https://github.com/abhid1234/MindWeave"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-border hover:bg-accent group inline-flex items-center gap-2 rounded-lg border px-8 py-3.5 text-base font-semibold transition-colors"
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                </a>
              </div>
              {/* Trust signals */}
              <p className="text-muted-foreground mt-3 text-sm">
                Free forever for individuals&nbsp;&bull;&nbsp;Privacy-first&nbsp;&bull;&nbsp;No
                credit card required
              </p>

              {/* Social Proof Strip */}
              <div className="text-muted-foreground mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-yellow-500" />
                  {gitHubStars} GitHub stars
                </span>
                <span className="text-border">|</span>
                <span>2,425+ tests passing</span>
                <span className="text-border">|</span>
                <span>Open source &amp; free</span>
              </div>

              {/* Product Hunt */}
              <div className="mt-6 flex justify-center">
                <a
                  href="https://www.producthunt.com/products/mindweave-2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/5 px-5 py-2 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-500/10 dark:text-orange-400"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 40 40"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M22.667 20H17.333V13.333H22.667C24.507 13.333 26 14.827 26 16.667C26 18.507 24.507 20 22.667 20ZM22.667 10H14V30H17.333V23.333H22.667C26.347 23.333 29.333 20.347 29.333 16.667C29.333 12.987 26.347 10 22.667 10Z" />
                  </svg>
                  Live on Product Hunt
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Social Proof Counters */}
              {stats?.data && (
                <div className="mt-10">
                  <SocialProofCounters
                    tilCount={stats.data.tilCount}
                    collectionCount={stats.data.collectionCount}
                    noteCount={stats.data.noteCount}
                    userCount={stats.data.userCount}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* See It In Action */}
        <section className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <ScrollReveal>
                <div className="mb-12 text-center">
                  <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                    See it in <span className="text-gradient">action</span>
                  </h2>
                  <p className="text-muted-foreground mt-4 text-lg">
                    Watch how Mindweave helps you capture, organize, and rediscover your knowledge.
                  </p>
                </div>
                <div className="bg-card shadow-soft-md overflow-hidden rounded-xl border">
                  <video
                    controls
                    preload="metadata"
                    poster="/videos/mindweave-explainer-poster.jpg"
                    className="aspect-video w-full bg-black"
                    width={1920}
                    height={1080}
                  >
                    <source
                      src="/videos/mindweave-explainer-mobile.mp4"
                      type="video/mp4"
                      media="(max-width: 768px)"
                    />
                    <source src="/videos/mindweave-explainer.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Feature Deep-Dive Tabs */}
        <FeatureTabs />

        {/* How It Works */}
        <section id="how-it-works" className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <ScrollReveal>
                <div className="mb-16 text-center">
                  <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                    Four steps. <span className="text-gradient">Total recall.</span>
                  </h2>
                  <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg">
                    Save it once and let AI handle the rest.
                  </p>
                </div>
              </ScrollReveal>
              <div className="grid gap-6 sm:grid-cols-2">
                {steps.map((step, i) => {
                  const StepIcon = step.icon;
                  return (
                    <ScrollReveal key={step.number} delay={i * 100}>
                      <div
                        className={`group relative rounded-xl border ${step.cardBorder} ${step.cardBg} hover:shadow-soft-md hover:border-primary/20 h-full p-8 transition-all duration-300 hover:-translate-y-1`}
                      >
                        <div className="flex items-start gap-5">
                          <div className="flex-shrink-0">
                            <div
                              className={`flex h-14 w-14 items-center justify-center rounded-xl ${step.bg} ${step.border} border`}
                            >
                              <StepIcon className={`h-6 w-6 ${step.color}`} />
                            </div>
                            <span className="text-muted-foreground/60 mt-2 block text-center text-xs font-bold">
                              {step.number}
                            </span>
                          </div>
                          <div className="pt-1">
                            <h3 className="text-xl font-semibold">{step.title}</h3>
                            <p className="text-primary/80 mt-0.5 text-sm font-medium">
                              {step.subtitle}
                            </p>
                            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
              <ScrollReveal>
                <div className="mt-12 text-center">
                  <Link
                    href="/login"
                    className="bg-primary text-primary-foreground group inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-base font-semibold shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                  >
                    Try It Now &mdash; It&apos;s Free
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <ScrollReveal>
                <div className="mb-16 text-center">
                  <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                    How Mindweave <span className="text-gradient">compares</span>
                  </h2>
                  <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
                    See what sets Mindweave apart from existing knowledge tools.
                  </p>
                </div>
              </ScrollReveal>

              {/* Desktop table */}
              <ScrollReveal>
                <div className="bg-card shadow-soft-md hidden overflow-hidden rounded-xl border md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="px-6 py-4 text-left font-semibold">Feature</th>
                        <th className="text-primary px-4 py-4 text-center font-semibold">
                          Mindweave
                        </th>
                        <th className="text-muted-foreground px-4 py-4 text-center font-semibold">
                          Notion
                        </th>
                        <th className="text-muted-foreground px-4 py-4 text-center font-semibold">
                          Evernote
                        </th>
                        <th className="text-muted-foreground px-4 py-4 text-center font-semibold">
                          Obsidian
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonFeatures.map((row, i) => (
                        <tr
                          key={row.feature}
                          className={
                            i < comparisonFeatures.length - 1 ? 'border-border/50 border-b' : ''
                          }
                        >
                          <td className="px-6 py-3.5 font-medium">{row.feature}</td>
                          <td className="px-4 py-3.5 text-center">
                            <ComparisonCell value={row.mindweave} />
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <ComparisonCell value={row.notion} />
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <ComparisonCell value={row.evernote} />
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <ComparisonCell value={row.obsidian} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollReveal>

              {/* Mobile: Mindweave advantages list */}
              <ScrollReveal>
                <div className="space-y-3 md:hidden">
                  {comparisonFeatures
                    .filter(
                      (row) =>
                        row.mindweave === 'yes' && (row.notion === 'no' || row.evernote === 'no')
                    )
                    .map((row) => (
                      <div
                        key={row.feature}
                        className="bg-card flex items-center gap-3 rounded-lg border p-4"
                      >
                        <Check className="h-5 w-5 flex-shrink-0 text-green-500" />
                        <span className="text-sm font-medium">{row.feature}</span>
                      </div>
                    ))}
                  <p className="text-muted-foreground pt-2 text-center text-xs">
                    Compared to Notion, Evernote, and Obsidian
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Who It's For */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <ScrollReveal>
                <div className="mb-16 text-center">
                  <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                    Built for <span className="text-gradient">curious minds</span>
                  </h2>
                  <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
                    See how people like you use Mindweave every day.
                  </p>
                </div>
              </ScrollReveal>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {useCases.map((useCase, i) => {
                  const Icon = useCase.icon;
                  return (
                    <ScrollReveal key={useCase.title} delay={i * 100}>
                      <div
                        className={`spotlight-card group rounded-xl border ${useCase.cardBorder} ${useCase.cardBg} hover:shadow-soft-md hover:border-primary/20 h-full p-8 transition-all duration-300 hover:-translate-y-1`}
                      >
                        <div
                          className={`inline-flex rounded-xl p-3 ${useCase.bg} ${useCase.border} mb-4 border`}
                        >
                          <Icon className={`h-6 w-6 ${useCase.color}`} />
                        </div>
                        <h3 className="text-lg font-semibold">{useCase.title}</h3>
                        <p className={`text-sm italic ${useCase.color} mb-3 mt-1 opacity-80`}>
                          {useCase.scenario}
                        </p>
                        <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                          {useCase.description}
                        </p>
                        <ul className="space-y-2">
                          {useCase.bullets.map((bullet) => (
                            <li
                              key={bullet}
                              className="text-muted-foreground flex items-start gap-2 text-sm"
                            >
                              <span
                                className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${useCase.color} opacity-60`}
                                style={{ backgroundColor: 'currentColor' }}
                              />
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Beyond the Basics */}
        <section className="bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <ScrollReveal>
                <div className="mb-16 text-center">
                  <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                    Beyond the <span className="text-gradient">basics</span>
                  </h2>
                  <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
                    Mindweave keeps shipping. Here&apos;s what else is in the box.
                  </p>
                </div>
              </ScrollReveal>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    icon: Users,
                    title: 'Collaborative Collections',
                    desc: 'Share collections with role-based access',
                  },
                  {
                    icon: Zap,
                    title: 'Daily Highlights',
                    desc: 'AI-powered daily content spotlight',
                  },
                  {
                    icon: Layout,
                    title: 'Content Templates',
                    desc: 'Quick-start templates for common note types',
                  },
                  {
                    icon: Mic,
                    title: 'Voice Capture',
                    desc: 'Speak your ideas, AI transcribes them',
                  },
                  {
                    icon: Camera,
                    title: 'Screenshot OCR',
                    desc: 'Extract text from images with Gemini Vision',
                  },
                  {
                    icon: Link2,
                    title: 'URL Summarizer',
                    desc: 'Auto-summarize articles and YouTube videos',
                  },
                  { icon: Bell, title: 'Reminders', desc: 'Spaced repetition review scheduling' },
                  {
                    icon: Webhook,
                    title: 'Webhook Integrations',
                    desc: 'Connect to Slack, Discord, and custom APIs',
                  },
                  {
                    icon: BarChart3,
                    title: 'Knowledge Wrapped',
                    desc: 'Shareable year-in-review stats',
                  },
                  {
                    icon: Newspaper,
                    title: 'TIL Public Feed',
                    desc: 'Share bite-sized learnings publicly',
                  },
                  {
                    icon: History,
                    title: 'Version History',
                    desc: 'Track and compare content changes',
                  },
                  {
                    icon: Key,
                    title: 'API Access',
                    desc: 'REST API with key-based auth for integrations',
                  },
                ].map((feature, i) => {
                  const Icon = feature.icon;
                  return (
                    <ScrollReveal key={feature.title} delay={i * 50}>
                      <div className="border-border/50 bg-card hover:shadow-soft hover:border-primary/20 group flex h-full items-start gap-4 rounded-xl border p-5 transition-all duration-300 hover:-translate-y-0.5">
                        <div className="bg-primary/10 border-primary/20 flex-shrink-0 rounded-lg border p-2.5">
                          <Icon className="text-primary h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">{feature.title}</h3>
                          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                            {feature.desc}
                          </p>
                        </div>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Available Everywhere */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <ScrollReveal>
                <div className="mb-16 text-center">
                  <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                    Available everywhere
                  </h2>
                  <p className="text-muted-foreground mt-4 text-lg">
                    Capture knowledge from any device, any browser, anywhere.
                  </p>
                </div>
              </ScrollReveal>
              <div className="grid gap-6 sm:grid-cols-3">
                {/* Web App */}
                <ScrollReveal delay={0}>
                  <div className="hover:shadow-soft-md hover:border-primary/20 group h-full rounded-xl border border-blue-500/15 bg-blue-500/5 p-8 text-center transition-all duration-300 hover:-translate-y-1">
                    <div className="mb-5 inline-flex rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                      <Globe className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">Web App</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Full-featured dashboard for capturing, searching, and managing your knowledge
                      base from any browser.
                    </p>
                  </div>
                </ScrollReveal>
                {/* Chrome Extension */}
                <ScrollReveal delay={100}>
                  <a
                    href="https://chromewebstore.google.com/detail/mindweave-quick-capture/dijnigojjcgddengnjlohamenopgpelp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:shadow-soft-md hover:border-primary/20 group block h-full rounded-xl border border-green-500/15 bg-green-500/5 p-8 text-center transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="mb-5 inline-flex rounded-xl border border-green-500/20 bg-green-500/10 p-4">
                      <Chrome className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">Chrome Extension</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Save any webpage with one click. Auto-captures title, URL, and content — AI
                      tags it instantly.
                    </p>
                    <span className="text-primary mt-3 inline-flex items-center gap-1 text-xs font-medium">
                      Get it on Chrome Web Store
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </a>
                </ScrollReveal>
                {/* Android App */}
                <ScrollReveal delay={200}>
                  <div className="hover:shadow-soft-md hover:border-primary/20 group relative h-full rounded-xl border border-purple-500/15 bg-purple-500/5 p-8 text-center transition-all duration-300 hover:-translate-y-1">
                    <span className="absolute right-3 top-3 inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-600">
                      Coming Soon
                    </span>
                    <div className="mb-5 inline-flex rounded-xl border border-purple-500/20 bg-purple-500/10 p-4">
                      <Smartphone className="h-8 w-8 text-purple-500" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">Android App</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Capture ideas on the go. Share links and notes directly from any app to your
                      Mindweave knowledge base. Currently in Closed Testing.
                    </p>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </section>

        {/* Command Palette Showcase */}
        <CommandPaletteShowcase />

        {/* Open Source + Credibility */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <ScrollReveal>
              <div className="mx-auto max-w-3xl text-center">
                <div className="border-border/60 bg-background/80 text-muted-foreground mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium">
                  <Github className="h-4 w-4" />
                  Open Source
                </div>
                <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
                  Built in the open
                </h2>
                <p className="text-muted-foreground mx-auto mb-8 max-w-xl text-lg">
                  Mindweave is fully open source. Explore the code, contribute, or self-host your
                  own instance.
                </p>
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <a
                    href="https://github.com/abhid1234/MindWeave"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-border hover:bg-accent group inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-base font-semibold transition-colors"
                  >
                    <Github className="h-5 w-5" />
                    Star on GitHub
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
                <div className="text-muted-foreground mt-8 flex items-center justify-center gap-6 text-sm">
                  <span>2,425+ tests passing</span>
                  <span className="text-border">|</span>
                  <span>TypeScript strict</span>
                  <span className="text-border">|</span>
                  <span>MIT License</span>
                </div>
                {/* Tech stack row */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  {techNames.map((name) => (
                    <span
                      key={name}
                      className="border-border/60 bg-background/80 text-muted-foreground inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Final CTA */}
        <section className="from-primary/10 via-primary/5 bg-gradient-to-br to-transparent py-24">
          <div className="container mx-auto px-4 text-center">
            <ScrollReveal>
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
                Your ideas deserve a second brain
              </h2>
              <p className="text-muted-foreground mx-auto mb-10 max-w-lg text-lg">
                Join researchers, developers, and lifelong learners who never forget.
              </p>
              <Link
                href="/login"
                className="bg-primary text-primary-foreground group inline-flex items-center gap-2 rounded-lg px-10 py-4 text-lg font-semibold shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
              >
                Create Your Free Account
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="text-muted-foreground container mx-auto px-4 text-center text-sm">
          <div className="mb-3 flex flex-wrap items-center justify-center gap-4">
            <span className="text-foreground/70 font-medium">Use Cases</span>
            <span>&middot;</span>
            <Link
              href="/use-cases/ai-note-taking"
              className="hover:text-foreground transition-colors"
            >
              AI Note Taking
            </Link>
            <span>&middot;</span>
            <Link
              href="/use-cases/second-brain"
              className="hover:text-foreground transition-colors"
            >
              Second Brain
            </Link>
            <span>&middot;</span>
            <Link href="/use-cases/researchers" className="hover:text-foreground transition-colors">
              Researchers
            </Link>
            <span>&middot;</span>
            <Link href="/use-cases/developers" className="hover:text-foreground transition-colors">
              Developers
            </Link>
            <span>&middot;</span>
            <Link href="/use-cases/students" className="hover:text-foreground transition-colors">
              Students
            </Link>
          </div>
          <div className="mb-3 flex flex-wrap items-center justify-center gap-4">
            <span className="text-foreground/70 font-medium">Compare</span>
            <span>&middot;</span>
            <Link href="/compare/notion" className="hover:text-foreground transition-colors">
              vs Notion
            </Link>
            <span>&middot;</span>
            <Link href="/compare/obsidian" className="hover:text-foreground transition-colors">
              vs Obsidian
            </Link>
            <span>&middot;</span>
            <Link href="/compare/evernote" className="hover:text-foreground transition-colors">
              vs Evernote
            </Link>
          </div>
          <div className="mb-3 flex flex-wrap items-center justify-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <span>&middot;</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <span>&middot;</span>
            <Link href="/docs" className="hover:text-foreground transition-colors">
              Docs
            </Link>
            <span>&middot;</span>
            <Link href="/support" className="hover:text-foreground transition-colors">
              Support
            </Link>
            <span>&middot;</span>
            <a
              href="https://github.com/abhid1234/MindWeave"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
            <span>&middot;</span>
            <a
              href="https://abhid.substack.com/p/i-built-an-ai-powered-second-brain"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Blog
            </a>
          </div>
          <p>&copy; 2026 Mindweave. Built with Next.js, Gemini AI, and pgvector.</p>
          <p className="text-muted-foreground/60 mt-2 text-xs">
            Found a bug?{' '}
            <a
              href="https://github.com/abhid1234/MindWeave/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground underline transition-colors"
            >
              Report it on GitHub
            </a>{' '}
            &mdash; every report helps us improve.
          </p>
        </div>
      </footer>
    </div>
  );
}
