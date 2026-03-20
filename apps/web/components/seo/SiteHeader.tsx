import Link from 'next/link';
import Image from 'next/image';

export function SiteHeader() {
  return (
    <header className="border-border/50 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-gradient flex items-center gap-2 text-2xl font-bold">
          <Image
            src="/icons/icon.svg"
            alt="Mindweave logo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          Mindweave
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/use-cases/ai-note-taking"
            className="text-muted-foreground hover:text-foreground hidden text-sm font-medium transition-colors sm:inline-block"
          >
            Use Cases
          </Link>
          <Link
            href="/features/semantic-search"
            className="text-muted-foreground hover:text-foreground hidden text-sm font-medium transition-colors sm:inline-block"
          >
            Features
          </Link>
          <Link
            href="/compare/notion"
            className="text-muted-foreground hover:text-foreground hidden text-sm font-medium transition-colors sm:inline-block"
          >
            Compare
          </Link>
          <Link
            href="/blog"
            className="text-muted-foreground hover:text-foreground hidden text-sm font-medium transition-colors sm:inline-block"
          >
            Blog
          </Link>
          <Link
            href="/docs"
            className="text-muted-foreground hover:text-foreground hidden text-sm font-medium transition-colors sm:inline-block"
          >
            Docs
          </Link>
          <Link
            href="/login"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
