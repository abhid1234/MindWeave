'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import {
  createLearningPathAction,
  updateLearningPathAction,
} from '@/app/actions/learning-paths';

interface CreatePathDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editPath?: {
    id: string;
    title: string;
    description: string | null;
    estimatedMinutes: number | null;
    difficulty: string | null;
    isPublic: boolean;
  };
}

export function CreatePathDialog({ open, onClose, onSuccess, editPath }: CreatePathDialogProps) {
  const [title, setTitle] = useState(editPath?.title ?? '');
  const [description, setDescription] = useState(editPath?.description ?? '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    editPath?.estimatedMinutes?.toString() ?? ''
  );
  const [difficulty, setDifficulty] = useState(editPath?.difficulty ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const params = {
      title: title.trim(),
      description: description.trim() || null,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : null,
      difficulty: (difficulty || null) as 'beginner' | 'intermediate' | 'advanced' | null,
    };

    const result = editPath
      ? await updateLearningPathAction(editPath.id, params)
      : await createLearningPathAction(params);

    setLoading(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{editPath ? 'Edit Path' : 'Create Learning Path'}</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted" aria-label="Close dialog">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="path-title" className="block text-sm font-medium mb-1">
              Title *
            </label>
            <input
              id="path-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="e.g., Learn React Fundamentals"
              maxLength={200}
              required
            />
          </div>

          <div>
            <label htmlFor="path-description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              id="path-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="What will you learn?"
              rows={3}
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="path-difficulty" className="block text-sm font-medium mb-1">
                Difficulty
              </label>
              <select
                id="path-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">None</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label htmlFor="path-time" className="block text-sm font-medium mb-1">
                Est. Minutes
              </label>
              <input
                id="path-time"
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="60"
                min={1}
                max={10000}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm border border-input hover:bg-muted"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              disabled={loading || !title.trim()}
            >
              {loading ? 'Saving...' : editPath ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
