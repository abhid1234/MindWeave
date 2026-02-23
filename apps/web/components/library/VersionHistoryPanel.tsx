'use client';

import { useState, useCallback } from 'react';
import { History, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateUTC } from '@/lib/utils';
import {
  getContentVersionsAction,
  revertToVersionAction,
  type ContentVersionItem,
} from '@/app/actions/content';
import { MarkdownRenderer } from '@/components/editor/MarkdownRenderer';

type VersionHistoryPanelProps = {
  contentId: string;
  onReverted?: () => void;
};

export function VersionHistoryPanel({ contentId, onReverted }: VersionHistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [versions, setVersions] = useState<ContentVersionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reverting, setReverting] = useState<string | null>(null);

  const loadVersions = useCallback(async () => {
    setLoading(true);
    const result = await getContentVersionsAction(contentId);
    if (result.success) {
      setVersions(result.versions);
    }
    setLoading(false);
  }, [contentId]);

  const handleToggle = () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen && versions.length === 0) {
      loadVersions();
    }
  };

  const handleRevert = async (versionId: string) => {
    setReverting(versionId);
    const result = await revertToVersionAction(contentId, versionId);
    setReverting(null);
    if (result.success) {
      onReverted?.();
      loadVersions();
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <History className="h-4 w-4" />
        Version History
        {isOpen ? (
          <ChevronUp className="ml-auto h-4 w-4" />
        ) : (
          <ChevronDown className="ml-auto h-4 w-4" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-2">
          {loading ? (
            <div className="space-y-2">
              <div className="h-10 rounded-lg bg-muted animate-pulse" />
              <div className="h-10 rounded-lg bg-muted animate-pulse" />
            </div>
          ) : versions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              No previous versions yet. Versions are created when you edit content.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1.5">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="rounded-lg border bg-card text-sm"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(expandedId === version.id ? null : version.id)
                    }
                    className="flex w-full items-center gap-2 px-3 py-2 hover:bg-accent/50 transition-colors"
                  >
                    <span className="font-medium text-xs text-muted-foreground">
                      v{version.versionNumber}
                    </span>
                    <span className="truncate text-xs flex-1 text-left">
                      {version.title}
                    </span>
                    <time
                      dateTime={version.createdAt.toISOString()}
                      className="text-xs text-muted-foreground shrink-0"
                    >
                      {formatDateUTC(version.createdAt)}
                    </time>
                  </button>

                  {expandedId === version.id && (
                    <div className="border-t px-3 py-2 space-y-2">
                      {version.body ? (
                        <div className="max-h-32 overflow-y-auto text-xs">
                          <MarkdownRenderer
                            content={version.body}
                            className="prose-xs"
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No body content
                        </p>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleRevert(version.id)}
                        disabled={reverting === version.id}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        {reverting === version.id ? 'Restoring...' : 'Restore this version'}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
