import type { Metadata } from 'next';
import { PenSquare } from 'lucide-react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PostGenerator } from '@/components/post-generator/PostGenerator';

export const metadata: Metadata = {
  title: 'Create Post | Mindweave',
  description: 'Turn your knowledge into polished LinkedIn posts',
};

export default async function CreatePostPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <PenSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Create Post</h1>
            <p className="text-muted-foreground">
              Turn your knowledge into polished LinkedIn posts
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="animate-fade-up" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
        <PostGenerator />
      </div>
    </div>
  );
}
