'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Route,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Clock,
  BarChart,
  Loader2,
} from 'lucide-react';
import {
  getLearningPathDetailAction,
  deleteLearningPathAction,
} from '@/app/actions/learning-paths';
import type { LearningPathDetail } from '@/app/actions/learning-paths';
import { PathProgressBar } from '@/components/learning-paths/PathProgressBar';
import { PathItemList } from '@/components/learning-paths/PathItemList';
import { ContentPickerDialog } from '@/components/learning-paths/ContentPickerDialog';
import { CreatePathDialog } from '@/components/learning-paths/CreatePathDialog';
import { SuggestItemsPanel } from '@/components/learning-paths/SuggestItemsPanel';
import Link from 'next/link';

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function LearningPathDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathId = params.pathId as string;

  const [path, setPath] = useState<LearningPathDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadPath = useCallback(async () => {
    const result = await getLearningPathDetailAction(pathId);
    if (result.success && result.data) {
      setPath(result.data);
    }
    setLoading(false);
  }, [pathId]);

  useEffect(() => {
    loadPath();
  }, [loadPath]);

  const handleDelete = async () => {
    if (!confirm('Delete this learning path? This cannot be undone.')) return;
    setDeleting(true);
    const result = await deleteLearningPathAction(pathId);
    if (result.success) {
      router.push('/dashboard/learning-paths');
    }
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!path) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center py-16">
        <p className="text-muted-foreground">Learning path not found.</p>
        <Link href="/dashboard/learning-paths" className="text-primary text-sm mt-2 inline-block">
          Back to paths
        </Link>
      </div>
    );
  }

  const completedCount = path.items.filter((i) => i.isCompleted).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Back link */}
      <Link
        href="/dashboard/learning-paths"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to paths
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="rounded-lg bg-primary/10 p-2 mt-0.5">
            <Route className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{path.title}</h1>
            {path.description && (
              <p className="text-sm text-muted-foreground mt-1">{path.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {path.difficulty && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColors[path.difficulty] ?? ''}`}
                >
                  <BarChart className="h-3 w-3" />
                  {path.difficulty}
                </span>
              )}
              {path.estimatedMinutes && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {path.estimatedMinutes} min
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEdit(true)}
            className="rounded-md p-2 hover:bg-muted"
            aria-label="Edit path"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            aria-label="Delete path"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Progress */}
      {path.items.length > 0 && (
        <PathProgressBar completed={completedCount} total={path.items.length} />
      )}

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">
            Items ({path.items.length})
          </h2>
          <button
            onClick={() => setShowPicker(true)}
            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
          >
            <Plus className="h-3 w-3" />
            Add Item
          </button>
        </div>
        <PathItemList pathId={pathId} items={path.items} onUpdate={loadPath} />
      </div>

      {/* AI Suggestions */}
      <SuggestItemsPanel pathId={pathId} onItemAdded={loadPath} />

      {/* Dialogs */}
      <ContentPickerDialog
        open={showPicker}
        onClose={() => setShowPicker(false)}
        pathId={pathId}
        onItemAdded={loadPath}
      />

      {showEdit && (
        <CreatePathDialog
          open={showEdit}
          onClose={() => setShowEdit(false)}
          onSuccess={loadPath}
          editPath={path}
        />
      )}
    </div>
  );
}
