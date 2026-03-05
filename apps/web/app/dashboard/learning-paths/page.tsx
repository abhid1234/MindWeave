'use client';

import { useState, useEffect, useCallback } from 'react';
import { Route, Plus } from 'lucide-react';
import { getLearningPathsAction } from '@/app/actions/learning-paths';
import type { LearningPathSummary } from '@/app/actions/learning-paths';
import { PathCard } from '@/components/learning-paths/PathCard';
import { CreatePathDialog } from '@/components/learning-paths/CreatePathDialog';

export default function LearningPathsPage() {
  const [paths, setPaths] = useState<LearningPathSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const loadPaths = useCallback(async () => {
    const result = await getLearningPathsAction();
    if (result.success && result.data) {
      setPaths(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPaths();
  }, [loadPaths]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Route className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Learning Paths</h1>
            <p className="text-sm text-muted-foreground">
              Create structured tracks to guide your learning
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Path
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-lg border border-border/50 bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : paths.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Route className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-medium mb-2">No learning paths yet</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Create your first learning path to organize content into a structured progression.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create Path
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paths.map((path) => (
            <PathCard key={path.id} path={path} />
          ))}
        </div>
      )}

      <CreatePathDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={loadPaths}
      />
    </div>
  );
}
