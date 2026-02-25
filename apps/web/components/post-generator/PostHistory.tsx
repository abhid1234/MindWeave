'use client';

import { useState, useEffect, useTransition } from 'react';
import { Copy, Check, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { getPostHistoryAction, deletePostAction } from '@/app/actions/post-generator';

interface HistoryPost {
  id: string;
  postContent: string;
  tone: string;
  length: string;
  includeHashtags: boolean;
  sourceContentTitles: string[];
  createdAt: Date;
}

export function PostHistory() {
  const [posts, setPosts] = useState<HistoryPost[]>([]);
  const [isPending, startTransition] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function loadHistory() {
    startTransition(async () => {
      const result = await getPostHistoryAction();
      if (result.success) {
        setPosts(result.posts);
      }
      setLoaded(true);
    });
  }

  async function handleCopy(post: HistoryPost) {
    try {
      await navigator.clipboard.writeText(post.postContent);
      setCopiedId(post.id);
      addToast({ title: 'Copied to clipboard!', variant: 'success' });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      addToast({ title: 'Failed to copy', variant: 'error' });
    }
  }

  function handleDelete(postId: string) {
    startTransition(async () => {
      const result = await deletePostAction(postId);
      if (result.success) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        addToast({ title: 'Post deleted', variant: 'success' });
      } else {
        addToast({ title: result.message || 'Failed to delete', variant: 'error' });
      }
    });
  }

  if (!loaded && isPending) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Loading history...
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No posts generated yet. Create your first post to see it here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div
          key={post.id}
          className="rounded-lg border border-border p-4 transition-colors hover:bg-accent/50"
        >
          <p className="mb-2 text-sm leading-relaxed">
            {post.postContent.length > 150
              ? post.postContent.slice(0, 150) + '...'
              : post.postContent}
          </p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
              {post.tone}
            </span>
            <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
              {post.length}
            </span>
            {post.sourceContentTitles.length > 0 && (
              <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {post.sourceContentTitles.length} source{post.sourceContentTitles.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => handleCopy(post)}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-accent"
                aria-label="Copy post"
              >
                {copiedId === post.id ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                onClick={() => handleDelete(post.id)}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                aria-label="Delete post"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
