'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { History, ChevronDown, ChevronUp, RotateCcw, GitCompare, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateUTC } from '@/lib/utils';
import {
  getContentVersionsAction,
  revertToVersionAction,
  type ContentVersionItem,
} from '@/app/actions/content';
import { MarkdownRenderer } from '@/components/editor/MarkdownRenderer';
import { DiffView } from './DiffView';

const VersionComparisonDialog = dynamic(
  () => import('./VersionComparisonDialog').then((mod) => mod.VersionComparisonDialog),
  { loading: () => null }
);

type VersionHistoryPanelProps = {
  contentId: string;
  onReverted?: () => void;
  currentContent?: {
    title: string;
    body: string | null;
    url: string | null;
  };
};

export function VersionHistoryPanel({ contentId, onReverted, currentContent }: VersionHistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [versions, setVersions] = useState<ContentVersionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reverting, setReverting] = useState<string | null>(null);
  const [showDiffId, setShowDiffId] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

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

  // Get the "next" version's content for diff (i.e., what came after this version)
  const getNextContent = (index: number): { title: string; body: string | null } => {
    if (index === 0) {
      // Most recent version — compare against current content
      return {
        title: currentContent?.title ?? '',
        body: currentContent?.body ?? null,
      };
    }
    // Compare against the newer version (lower index = newer)
    const newer = versions[index - 1];
    return { title: newer.title, body: newer.body };
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
            <>
              {currentContent && versions.length >= 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs w-full"
                  onClick={() => setShowComparison(true)}
                >
                  <GitCompare className="mr-1 h-3 w-3" />
                  Compare Versions
                </Button>
              )}
              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {versions.map((version, index) => {
                  const nextContent = getNextContent(index);
                  const titleChanged = version.title !== nextContent.title;

                  return (
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
                        {titleChanged && (
                          <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-[10px] text-amber-700 dark:text-amber-300 shrink-0">
                            Title changed
                          </span>
                        )}
                        <time
                          dateTime={version.createdAt.toISOString()}
                          className="text-xs text-muted-foreground shrink-0"
                        >
                          {formatDateUTC(version.createdAt)}
                        </time>
                      </button>

                      {expandedId === version.id && (
                        <div className="border-t px-3 py-2 space-y-2">
                          {showDiffId === version.id && currentContent ? (
                            <DiffView
                              oldText={version.body ?? ''}
                              newText={nextContent.body ?? ''}
                              oldLabel={`v${version.versionNumber}`}
                              newLabel={index === 0 ? 'Current' : `v${versions[index - 1].versionNumber}`}
                            />
                          ) : version.body ? (
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
                          <div className="flex gap-1.5">
                            {currentContent && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() =>
                                  setShowDiffId(showDiffId === version.id ? null : version.id)
                                }
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                {showDiffId === version.id ? 'Show Content' : 'Show Changes'}
                              </Button>
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
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {currentContent && (
        <VersionComparisonDialog
          open={showComparison}
          onOpenChange={setShowComparison}
          versions={versions}
          currentContent={currentContent}
        />
      )}
    </div>
  );
}
