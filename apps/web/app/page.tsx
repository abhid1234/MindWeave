import Link from 'next/link';
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
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Quick Capture',
    description: 'Save notes, links, and files instantly. Your ideas are just a click away.',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
  {
    icon: Tags,
    title: 'AI Auto-Tagging',
    description: 'Claude automatically tags your content, making it easy to organize and find.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Search,
    title: 'Semantic Search',
    description: 'Search by meaning, not just keywords. Find related ideas you forgot you had.',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    icon: MessageCircleQuestion,
    title: 'Knowledge Q&A',
    description: 'Ask questions and get answers from your personal knowledge base.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Library,
    title: 'Smart Library',
    description: 'Browse, filter, and rediscover your content in one beautiful interface.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data stays yours. Self-host or use our secure cloud.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
];

const steps = [
  { number: '1', title: 'Capture', description: 'Save notes, links, or upload files in seconds.' },
  { number: '2', title: 'Organize', description: 'AI auto-tags and embeds your content for you.' },
  { number: '3', title: 'Rediscover', description: 'Search semantically or ask questions to find anything.' },
];

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Mindweave
          </span>
          <div className="flex items-center gap-3">
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
            <Link
              href="/login"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="container relative mx-auto px-4 py-24 sm:py-32 lg:py-40">
            <div className="mx-auto max-w-3xl text-center animate-fade-up">
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Your AI-Powered
                <br />
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  Knowledge Hub
                </span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl max-w-2xl mx-auto">
                Capture ideas, save bookmarks, and organize notes. Let AI help you
                rediscover and connect your knowledge when you need it most.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-md hover:shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#features"
                  className="rounded-lg border border-border px-6 py-3 text-base font-semibold hover:bg-accent transition-colors"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Everything you need to{' '}
                  <span className="text-gradient">remember</span>
                </h2>
                <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                  Powered by Claude AI and semantic search to help you capture, organize,
                  and rediscover your knowledge effortlessly.
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.title}
                      className="group rounded-xl border bg-card p-6 transition-all duration-300 hover:shadow-soft-md hover:-translate-y-1 hover:border-primary/20"
                    >
                      <div className={`inline-flex rounded-lg p-2.5 ${feature.bg} mb-4`}>
                        <Icon className={`h-5 w-5 ${feature.color}`} />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold sm:text-4xl">
                  How it works
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Three simple steps to build your personal knowledge base.
                </p>
              </div>
              <div className="grid gap-8 sm:grid-cols-3">
                {steps.map((step) => (
                  <div key={step.number} className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                      {step.number}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-muted/50 py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl mb-4">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Start capturing your ideas and let AI help you build a connected knowledge base.
            </p>
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-md hover:shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
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
            <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
          </div>
          <p>&copy; 2026 Mindweave. Built with Next.js, Claude AI, and pgvector.</p>
        </div>
      </footer>
    </div>
  );
}
