'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Pencil, Share2, Trash2, Star, Globe, File, FileText, Image as ImageIcon, Download, ExternalLink, Sparkles, Loader2 } from 'lucide-react';
import { MarkdownRenderer } from '@/components/editor/MarkdownRenderer';
import { VersionHistoryPanel } from './VersionHistoryPanel';
import NextImage from 'next/image';
import type { ContentType } from '@/lib/db/schema';
import { formatDateUTC } from '@/lib/utils';
import { getRecommendationsAction } from '@/app/actions/search';
import type { RecommendationResult } from '@/app/actions/search';
import { trackContentViewAction } from '@/app/actions/views';
import { generateSummaryAction } from '@/app/actions/content';
import { RecommendationCard } from './RecommendationCard';
import { ReminderButton } from '@/components/reminders/ReminderButton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const DeleteConfirmDialog = dynamic(
  () => import('./DeleteConfirmDialog').then((mod) => mod.DeleteConfirmDialog),
  { loading: () => null }
);
const ContentEditDialog = dynamic(
  () => import('./ContentEditDialog').then((mod) => mod.ContentEditDialog),
  { loading: () => null }
);
const ShareDialog = dynamic(
  () => import('./ShareDialog').then((mod) => mod.ShareDialog),
  { loading: () => null }
);

export type ContentDetailDialogProps = {
  content: {
    id: string;
    type: ContentType;
    title: string;
    body: string | null;
    url: string | null;
    tags: string[];
    autoTags: string[];
    createdAt: Date;
    isFavorite?: boolean;
    isShared?: boolean;
    shareId?: string | null;
    summary?: string | null;
    metadata?: {
      fileType?: string;
      fileSize?: number;
      filePath?: string;
      fileName?: string;
      [key: string]: unknown;
    } | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getFileIcon(fileType?: string) {
  if (!fileType) return <File className="h-8 w-8 text-gray-500" aria-hidden="true" />;
  if (fileType.startsWith('image/')) {
    return <ImageIcon className="h-8 w-8 text-blue-500" aria-hidden="true" />;
  }
  if (fileType === 'application/pdf') {
    return <FileText className="h-8 w-8 text-red-500" aria-hidden="true" />;
  }
  return <File className="h-8 w-8 text-gray-500" aria-hidden="true" />;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ContentDetailDialog({
  content,
  open,
  onOpenChange,
}: ContentDetailDialogProps) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [currentSummary, setCurrentSummary] = useState(content.summary);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const { id, type, title, body, url, tags, autoTags, createdAt, isFavorite, isShared, shareId, metadata } = content;

  useEffect(() => {
    setCurrentSummary(content.summary);
  }, [content.summary, content.id]);

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const result = await generateSummaryAction(id);
      if (result.success && result.summary) {
        setCurrentSummary(result.summary);
      }
    } catch {
      // Error handled silently
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setRecommendations([]);
      return;
    }

    // Fire-and-forget view tracking
    trackContentViewAction(id).catch(() => {});

    let cancelled = false;
    setRecsLoading(true);

    getRecommendationsAction(id, 4, 0.3).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setRecommendations(result.recommendations);
      }
      setRecsLoading(false);
    }).catch(() => {
      if (!cancelled) setRecsLoading(false);
    });

    return () => { cancelled = true; };
  }, [open, id]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pr-8">
            <div className="flex items-center gap-2 mb-1">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                type === 'note'
                  ? 'bg-note/10 text-note dark:bg-note/20'
                  : type === 'link'
                    ? 'bg-link/10 text-link dark:bg-link/20'
                    : 'bg-file/10 text-file dark:bg-file/20'
              }`}>
                {type}
              </span>
              {isShared && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <Globe className="h-3 w-3" aria-hidden="true" />
                  Shared
                </span>
              )}
              {isFavorite && (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-label="Favorited" />
              )}
              <span className="text-xs text-muted-foreground">
                &middot;
              </span>
              <span className="text-xs text-muted-foreground">
                <time dateTime={createdAt.toISOString()}>{formatDateUTC(createdAt)}</time>
              </span>
            </div>
            <DialogTitle className="text-xl">{title}</DialogTitle>
            <DialogDescription className="sr-only">
              Details for {title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary */}
            {currentSummary ? (
              <p className="text-sm italic text-muted-foreground border-l-2 border-primary/30 pl-3">
                {currentSummary}
              </p>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary}
                data-testid="generate-summary-btn"
              >
                {isGeneratingSummary ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                )}
                Generate Summary
              </Button>
            )}

            {/* URL for links */}
            {url && type !== 'file' && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-primary hover:underline break-all"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {url}
              </a>
            )}

            {/* File preview for file type */}
            {type === 'file' && metadata?.filePath && (
              <div>
                {metadata.fileType?.startsWith('image/') ? (
                  <a
                    href={metadata.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative h-48 w-full"
                  >
                    <NextImage
                      src={metadata.filePath}
                      alt={title}
                      fill
                      className="object-contain rounded-md"
                      sizes="(max-width: 640px) 100vw, 560px"
                    />
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-md">
                    {getFileIcon(metadata.fileType)}
                    <a
                      href={metadata.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0 hover:underline"
                    >
                      <p className="text-sm font-medium truncate">
                        {metadata.fileName || title}
                      </p>
                      {metadata.fileSize && (
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(metadata.fileSize)}
                        </p>
                      )}
                    </a>
                    <a
                      href={metadata.filePath}
                      download
                      className="p-2 hover:bg-secondary rounded-md"
                      aria-label="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Body text */}
            {body && (
              <MarkdownRenderer content={body} />
            )}

            {/* Tags */}
            {((tags?.length ?? 0) > 0 || (autoTags?.length ?? 0) > 0) && (
              <div className="flex flex-wrap gap-2">
                {(tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {tag}
                  </span>
                ))}
                {(autoTags ?? []).map((tag) => (
                  <span
                    key={`auto-${tag}`}
                    className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {tag} (AI)
                  </span>
                ))}
              </div>
            )}

            {/* Version History */}
            <VersionHistoryPanel
              contentId={id}
              onReverted={() => onOpenChange(false)}
              currentContent={{ title, body, url }}
            />

            {/* Similar Content */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Similar Content
              </div>
              {recsLoading ? (
                <div className="space-y-2">
                  <div className="h-14 rounded-lg bg-muted animate-pulse" />
                  <div className="h-14 rounded-lg bg-muted animate-pulse" />
                </div>
              ) : recommendations.length > 0 ? (
                <div className="space-y-2">
                  {recommendations.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      id={rec.id}
                      title={rec.title}
                      type={rec.type}
                      body={rec.body}
                      tags={[...rec.tags, ...rec.autoTags]}
                      similarity={rec.similarity}
                      onClick={() => {
                        onOpenChange(false);
                        router.push(`/dashboard/library?highlight=${rec.id}`);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No similar content found yet. Add more items to see recommendations.</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsShareDialogOpen(true)}
              >
                <Share2 className="mr-1.5 h-3.5 w-3.5" />
                {isShared ? 'Manage Share' : 'Share'}
              </Button>
              <ReminderButton contentId={id} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ContentEditDialog
        content={{ id, type, title, body, url, metadata }}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <ShareDialog
        contentId={id}
        contentTitle={title}
        isShared={isShared ?? false}
        shareId={shareId ?? null}
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
      />

      <DeleteConfirmDialog
        contentId={id}
        contentTitle={title}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </>
  );
}
