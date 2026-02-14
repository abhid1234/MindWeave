'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { TagInput, type TagInputHandle } from '@/components/ui/tag-input';
import { updateContentTagsAction } from '@/app/actions/content';
import { cn } from '@/lib/utils';

export interface EditableTagsProps {
  contentId: string;
  initialTags: string[];
  autoTags: string[];
  allTags: string[];
  className?: string;
}

export function EditableTags({
  contentId,
  initialTags,
  autoTags,
  allTags,
  className,
}: EditableTagsProps) {
  const [tags, setTags] = React.useState(initialTags);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Sync local state when initialTags prop changes (after server re-fetch)
  React.useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  const isSavingRef = React.useRef(false);
  const tagInputRef = React.useRef<TagInputHandle>(null);

  const handleSave = React.useCallback(async () => {
    if (isSavingRef.current) return;
    // Commit any text still in the input field before saving
    const pendingTag = tagInputRef.current?.commitPending() || '';
    // Build final tags including any uncommitted input text
    let tagsToSave = tags;
    if (pendingTag && !tags.includes(pendingTag)) {
      tagsToSave = [...tags, pendingTag];
      setTags(tagsToSave);
    }
    isSavingRef.current = true;
    setIsSaving(true);
    setError(null);

    try {
      const result = await updateContentTagsAction({
        contentId,
        tags: tagsToSave,
      });

      if (!result.success) {
        setError(result.message);
        // Revert to initial tags on error
        setTags(initialTags);
      } else {
        setIsEditing(false);
      }
    } catch {
      setError('Failed to save tags. Please try again.');
      setTags(initialTags);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [contentId, tags, initialTags]);

  const handleCancel = React.useCallback(() => {
    setTags(initialTags);
    setIsEditing(false);
    setError(null);
  }, [initialTags]);

  // Auto-save when tags change (debounced)
  // Use ref to avoid re-creating effect when handleSave changes
  const handleSaveRef = React.useRef(handleSave);
  React.useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  React.useEffect(() => {
    if (!isEditing || isSavingRef.current) return;

    const timer = setTimeout(() => {
      if (JSON.stringify(tags) !== JSON.stringify(initialTags) && !isSavingRef.current) {
        handleSaveRef.current();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [tags, initialTags, isEditing]);

  if (isEditing) {
    return (
      <div className={cn('space-y-2 animate-in fade-in-50 duration-200', className)}>
        <TagInput
          ref={tagInputRef}
          tags={tags}
          suggestions={allTags}
          onChange={setTags}
          placeholder="Add tags..."
          maxTags={20}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs text-primary hover:underline disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="text-xs text-muted-foreground hover:underline disabled:opacity-50"
          >
            Cancel
          </button>
          {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2 animate-in fade-in-50 duration-200', className)}>
      <div className="flex flex-wrap gap-1">
        {tags.length > 0 ? (
          <>
            {tags.map((tag) => (
              <Badge key={tag} variant="default">
                {tag}
              </Badge>
            ))}
          </>
        ) : (
          <span className="text-xs text-muted-foreground">No tags</span>
        )}
        {autoTags.length > 0 && (
          <>
            {autoTags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </>
        )}
      </div>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="text-xs text-primary hover:underline"
      >
        Edit tags
      </button>
    </div>
  );
}
