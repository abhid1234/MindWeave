import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">Mindweave</h1>
          <Link
            href="/login"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-5xl font-bold tracking-tight sm:text-6xl">
              Your AI-Powered
              <br />
              <span className="text-primary">Personal Knowledge Hub</span>
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Capture ideas, save bookmarks, and organize notes. Let AI help you rediscover and
              connect your knowledge when you need it most.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/login"
                className="rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                Get Started
              </Link>
              <a
                href="#features"
                className="rounded-lg border border-border px-6 py-3 text-base font-semibold hover:bg-accent"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <h3 className="text-center text-3xl font-bold">Features</h3>
              <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border bg-card p-6">
                  <h4 className="text-xl font-semibold">Quick Capture</h4>
                  <p className="mt-2 text-muted-foreground">
                    Save notes, links, and files instantly. Your ideas are just a click away.
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <h4 className="text-xl font-semibold">AI Auto-Tagging</h4>
                  <p className="mt-2 text-muted-foreground">
                    Claude automatically tags your content, making it easy to organize and find.
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <h4 className="text-xl font-semibold">Semantic Search</h4>
                  <p className="mt-2 text-muted-foreground">
                    Search by meaning, not just keywords. Find related ideas you forgot you had.
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <h4 className="text-xl font-semibold">Knowledge Q&A</h4>
                  <p className="mt-2 text-muted-foreground">
                    Ask questions and get answers from your personal knowledge base.
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <h4 className="text-xl font-semibold">Smart Library</h4>
                  <p className="mt-2 text-muted-foreground">
                    Browse, filter, and rediscover your content in one beautiful interface.
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <h4 className="text-xl font-semibold">Privacy First</h4>
                  <p className="mt-2 text-muted-foreground">
                    Your data stays yours. Self-host or use our secure cloud.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Mindweave. Built with Next.js, Claude AI, and pgvector.</p>
        </div>
      </footer>
    </div>
  );
}
