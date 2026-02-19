import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  Zap,
  Tags,
  Search,
  MessageCircleQuestion,
  Library,
  Shield,
  ArrowRight,
  Github,
  BookOpen,
  Brain,
  Sparkles,
  Database,
  Lock,
  Palette,
  Code2,
  Layers,
  Smartphone,
  Chrome,
  Globe,
} from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export const metadata: Metadata = {
  title: 'Mindweave - AI-Powered Personal Knowledge Hub',
  description:
    'Stop losing your best ideas. Capture notes, links, and files — AI auto-tags, organizes, and lets you search by meaning. Open source.',
};

const features = [
  {
    icon: Zap,
    title: 'Quick Capture',
    description: 'Save notes, links, and files instantly. Your ideas are just a click away.',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    cardBg: 'bg-yellow-500/5',
    cardBorder: 'border-yellow-500/15',
  },
  {
    icon: Tags,
    title: 'AI Auto-Tagging',
    description: 'AI automatically tags your content, making it easy to organize and find.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    cardBg: 'bg-blue-500/5',
    cardBorder: 'border-blue-500/15',
  },
  {
    icon: Search,
    title: 'Semantic Search',
    description: 'Search by meaning, not just keywords. Find related ideas you forgot you had.',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    cardBg: 'bg-green-500/5',
    cardBorder: 'border-green-500/15',
  },
  {
    icon: MessageCircleQuestion,
    title: 'Knowledge Q&A',
    description: 'Ask questions and get answers from your personal knowledge base.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    cardBg: 'bg-purple-500/5',
    cardBorder: 'border-purple-500/15',
  },
  {
    icon: Library,
    title: 'Smart Library',
    description: 'Browse, filter, and rediscover your content in one beautiful interface.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    cardBg: 'bg-orange-500/5',
    cardBorder: 'border-orange-500/15',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data stays yours. Self-host or use our secure cloud.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    cardBg: 'bg-emerald-500/5',
    cardBorder: 'border-emerald-500/15',
  },
];

const steps = [
  {
    number: '1',
    title: 'Capture anything',
    subtitle: 'Notes, links, files.',
    description: 'Type a thought, paste a URL, or drop a file. One click and it\'s saved.',
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
    description: 'Semantic search finds related ideas, not just keyword matches. Or just ask a question.',
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
    description: 'Every idea resurfaces when you need it. Recommendations, clusters, and insights — all automatic.',
    icon: Sparkles,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    cardBg: 'bg-orange-500/5',
    cardBorder: 'border-orange-500/15',
  },
];

const techStack = [
  { name: 'Next.js 15', icon: Layers, color: 'text-foreground' },
  { name: 'TypeScript', icon: Code2, color: 'text-blue-500' },
  { name: 'PostgreSQL', icon: Database, color: 'text-sky-600' },
  { name: 'pgvector', icon: Search, color: 'text-violet-500' },
  { name: 'Tailwind CSS', icon: Palette, color: 'text-cyan-500' },
  { name: 'Auth.js', icon: Lock, color: 'text-emerald-500' },
  { name: 'Drizzle ORM', icon: Database, color: 'text-lime-500' },
  { name: 'Gemini AI', icon: Brain, color: 'text-orange-500' },
];

const heroPills = [
  'AI Tagging',
  'Semantic Search',
  'Knowledge Q&A',
  'Vector Embeddings',
  'Smart Library',
  'Chrome Extension',
  'Android App',
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
      ],
      screenshot: 'https://www.mindweave.space/opengraph-image',
    },
  ],
};

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header */}
      <header className="sticky top-0 z-50 glass glass-dark border-b border-border/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <span className="flex items-center gap-2 text-2xl font-bold text-gradient">
            <Image src="/icons/icon.svg" alt="Mindweave logo" width={32} height={32} className="rounded-lg" />
            Mindweave
          </span>
          <div className="flex items-center gap-6">
            <a
              href="#features"
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground transition-colors sm:inline-block"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground transition-colors sm:inline-block"
            >
              How It Works
            </a>
            <a
              href="#tech-stack"
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground transition-colors md:inline-block"
            >
              Tech Stack
            </a>
            <Link
              href="/docs"
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground transition-colors sm:inline-block"
            >
              Docs
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors btn-press"
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
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          {/* Dot grid pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.15]"
            style={{
              backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="container relative mx-auto px-4 py-24 sm:py-32 lg:py-40">
            <div className="mx-auto max-w-4xl text-center animate-fade-up">
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl">
                Your AI-Powered
                <br />
                <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Knowledge Hub
                </span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl lg:text-2xl max-w-2xl mx-auto">
                You read 100 articles a week.{' '}
                <span className="text-foreground font-medium">How many can you recall?</span>
                <br className="hidden sm:block" />
                Capture, organize, and rediscover everything with AI.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="https://github.com/abhid1234/MindWeave"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-lg border border-border px-8 py-3.5 text-base font-semibold hover:bg-accent transition-colors"
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                </a>
              </div>

              {/* Product Hunt */}
              <div className="mt-8 flex justify-center">
                <a
                  href="https://www.producthunt.com/products/mindweave-2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/5 px-5 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 40 40" fill="currentColor" aria-hidden="true">
                    <path d="M22.667 20H17.333V13.333H22.667C24.507 13.333 26 14.827 26 16.667C26 18.507 24.507 20 22.667 20ZM22.667 10H14V30H17.333V23.333H22.667C26.347 23.333 29.333 20.347 29.333 16.667C29.333 12.987 26.347 10 22.667 10Z" />
                  </svg>
                  Live on Product Hunt
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Floating feature pills */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                {heroPills.map((pill) => (
                  <span
                    key={pill}
                    className="inline-flex items-center rounded-full border border-border/60 bg-background/80 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-muted-foreground"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <ScrollReveal>
                <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                    Everything you need to{' '}
                    <span className="text-gradient">remember</span>
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                    Powered by Gemini AI and semantic search to help you capture, organize,
                    and rediscover your knowledge effortlessly.
                  </p>
                </div>
              </ScrollReveal>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((feature, i) => {
                  const Icon = feature.icon;
                  return (
                    <ScrollReveal key={feature.title} delay={i * 100}>
                      <div
                        className={`group spotlight-card rounded-xl border ${feature.cardBorder} ${feature.cardBg} p-6 transition-all duration-300 hover:shadow-soft-md hover:-translate-y-1 hover:border-primary/20 h-full`}
                      >
                        <div className={`inline-flex rounded-xl p-3 ${feature.bg} ${feature.border} border mb-4`}>
                          <Icon className={`h-6 w-6 ${feature.color}`} />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <ScrollReveal>
                <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                    Four steps.{' '}
                    <span className="text-gradient">Total recall.</span>
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                    Save it once and let AI handle the rest.
                  </p>
                </div>
              </ScrollReveal>
              <div className="grid gap-6 sm:grid-cols-2">
                {steps.map((step, i) => {
                  const StepIcon = step.icon;
                  return (
                    <ScrollReveal key={step.number} delay={i * 100}>
                      <div className={`group relative rounded-xl border ${step.cardBorder} ${step.cardBg} p-8 transition-all duration-300 hover:shadow-soft-md hover:-translate-y-1 hover:border-primary/20 h-full`}>
                        <div className="flex items-start gap-5">
                          <div className="flex-shrink-0">
                            <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${step.bg} ${step.border} border`}>
                              <StepIcon className={`h-6 w-6 ${step.color}`} />
                            </div>
                            <span className="mt-2 block text-center text-xs font-bold text-muted-foreground/60">
                              {step.number}
                            </span>
                          </div>
                          <div className="pt-1">
                            <h3 className="text-xl font-semibold">{step.title}</h3>
                            <p className="mt-0.5 text-sm font-medium text-primary/80">{step.subtitle}</p>
                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
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
                    className="group inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Try It Free
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* See It In Action */}
        <section className="bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <ScrollReveal>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                    See it in <span className="text-gradient">action</span>
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground">
                    Watch how Mindweave helps you capture, organize, and rediscover your knowledge.
                  </p>
                </div>
                <div className="rounded-xl border bg-card overflow-hidden shadow-soft-md">
                  <video
                    controls
                    preload="metadata"
                    poster="/videos/mindweave-explainer-poster.jpg"
                    className="w-full aspect-video bg-black"
                    width={1920}
                    height={1080}
                  >
                    <source src="/videos/mindweave-explainer-mobile.mp4" type="video/mp4" media="(max-width: 768px)" />
                    <source src="/videos/mindweave-explainer.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Available Everywhere */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <ScrollReveal>
                <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                    Available everywhere
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground">
                    Capture knowledge from any device, any browser, anywhere.
                  </p>
                </div>
              </ScrollReveal>
              <div className="grid gap-6 sm:grid-cols-3">
                {/* Web App */}
                <ScrollReveal delay={0}>
                  <div className="group rounded-xl border border-blue-500/15 bg-blue-500/5 p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-md hover:border-primary/20 h-full">
                    <div className="inline-flex rounded-xl p-4 bg-blue-500/10 border border-blue-500/20 mb-5">
                      <Globe className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Web App</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Full-featured dashboard for capturing, searching, and managing your knowledge base from any browser.
                    </p>
                  </div>
                </ScrollReveal>
                {/* Chrome Extension */}
                <ScrollReveal delay={100}>
                  <a
                    href="https://chromewebstore.google.com/detail/mindweave-quick-capture/dijnigojjcgddengnjlohamenopgpelp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-xl border border-green-500/15 bg-green-500/5 p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-md hover:border-primary/20 block h-full"
                  >
                    <div className="inline-flex rounded-xl p-4 bg-green-500/10 border border-green-500/20 mb-5">
                      <Chrome className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Chrome Extension</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Save any webpage with one click. Auto-captures title, URL, and content — AI tags it instantly.
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                      Get it on Chrome Web Store
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </a>
                </ScrollReveal>
                {/* Android App */}
                <ScrollReveal delay={200}>
                  <div className="group relative rounded-xl border border-purple-500/15 bg-purple-500/5 p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-md hover:border-primary/20 h-full">
                    <span className="absolute top-3 right-3 inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-amber-600">
                      Coming Soon
                    </span>
                    <div className="inline-flex rounded-xl p-4 bg-purple-500/10 border border-purple-500/20 mb-5">
                      <Smartphone className="h-8 w-8 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Android App</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Capture ideas on the go. Share links and notes directly from any app to your Mindweave knowledge base. Currently in Closed Testing.
                    </p>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section id="tech-stack" className="bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <ScrollReveal>
                <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                    Built with modern tech
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground">
                    Production-grade stack for reliability and performance.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {techStack.map((tech) => {
                    const TechIcon = tech.icon;
                    return (
                      <div
                        key={tech.name}
                        className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-md hover:border-primary/20"
                      >
                        <TechIcon className={`h-8 w-8 ${tech.color} transition-transform group-hover:scale-110`} />
                        <span className="text-sm font-semibold">{tech.name}</span>
                      </div>
                    );
                  })}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Open Source CTA */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <ScrollReveal>
              <div className="mx-auto max-w-3xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-1.5 text-sm font-medium text-muted-foreground mb-8">
                  <Github className="h-4 w-4" />
                  Open Source
                </div>
                <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl mb-4">
                  Built in the open
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                  Mindweave is fully open source. Explore the code, contribute, or self-host your own instance.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href="https://github.com/abhid1234/MindWeave"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-base font-semibold hover:bg-accent transition-colors"
                  >
                    <Github className="h-5 w-5" />
                    Star on GitHub
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
                <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                  <span>1,440+ tests passing</span>
                  <span className="text-border">|</span>
                  <span>TypeScript strict</span>
                  <span className="text-border">|</span>
                  <span>MIT License</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Soft Launch Notice */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <ScrollReveal>
              <div className="mx-auto max-w-2xl rounded-xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
                <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-600 mb-4">
                  Soft Launch
                </span>
                <h3 className="text-xl font-semibold mb-2">Help Us Improve</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  This is Mindweave&apos;s first soft launch. The product is live and fully functional,
                  but we expect to discover bugs as more users start using it. If you run into anything
                  unexpected, please report it on GitHub — every bug report helps!
                </p>
                <a
                  href="https://github.com/abhid1234/MindWeave/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-semibold hover:bg-accent transition-colors"
                >
                  <Github className="h-4 w-4" />
                  Report a Bug on GitHub
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent py-24">
          <div className="container mx-auto px-4 text-center">
            <ScrollReveal>
              <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl mb-4">
                Stop losing your best ideas
              </h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto">
                Start building your AI-powered knowledge base today. Free and open source.
              </p>
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-lg bg-primary px-10 py-4 text-lg font-semibold text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-4 mb-3">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <span>&middot;</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <span>&middot;</span>
            <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
            <span>&middot;</span>
            <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
            <span>&middot;</span>
            <a
              href="https://github.com/abhid1234/MindWeave"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors inline-flex items-center gap-1"
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
        </div>
      </footer>
    </div>
  );
}
