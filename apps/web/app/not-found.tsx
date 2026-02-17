import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home, BookOpen } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <FileQuestion className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold">Page not found</h1>
        <p className="mb-6 text-muted-foreground">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been moved or
          doesn&apos;t exist.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button className="gap-2">
              <Home className="h-4 w-4" aria-hidden="true" />
              Go to home
            </Button>
          </Link>
          <Link href="/docs">
            <Button variant="outline" className="gap-2">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Browse docs
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Think this is a bug?{' '}
          <a
            href="https://github.com/abhid1234/MindWeave/issues"
            className="text-primary underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Report it on GitHub
          </a>
          .
        </p>
      </div>
    </div>
  );
}
