'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { MoreHorizontal, Pencil, Trash2, File, FileText, Image as ImageIcon, Download, Share2, Globe, FolderPlus, Star, Loader2, Sparkles } from 'lucide-react';
import NextImage from 'next/image';
import type { ContentType } from '@/lib/db/schema';
import { formatDateUTC } from '@/lib/utils';
import { EditableTags } from './EditableTags';
import { toggleFavoriteAction } from '@/app/actions/content';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Dynamic imports for dialogs to reduce initial bundle size
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
const CollectionSelector = dynamic(
  () => import('./CollectionSelector').then((mod) => mod.CollectionSelector),
  { loading: () => null }
);
const RecommendationsDialog = dynamic(
  () => import('./RecommendationsDialog').then((mod) => mod.RecommendationsDialog),
  { loading: () => null }
);

export type ContentCardProps = {
  id: string;
  type: ContentType;
  title: string;
  body: string | null;
  url: string | null;
  tags: string[];
  autoTags: string[];
  createdAt: Date;
  allTags?: string[];
  metadata?: {
    fileType?: string;
    fileSize?: number;
    filePath?: string;
    fileName?: string;
    [key: string]: unknown;
  } | null;
  isShared?: boolean;
  shareId?: string | null;
  isFavorite?: boolean;
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

export function ContentCard({
  id,
  type,
  title,
  body,
  url,
  tags,
  autoTags,
  createdAt,
  allTags = [],
  metadata,
  isShared: initialIsShared = false,
  shareId: initialShareId = null,
  isFavorite: initialIsFavorite = false,
}: ContentCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [isRecommendationsDialogOpen, setIsRecommendationsDialogOpen] = useState(false);
  const [isShared, setIsShared] = useState(initialIsShared);
  const [shareId, setShareId] = useState(initialShareId);
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  const handleShareStatusChange = (newIsShared: boolean, newShareId: string | null) => {
    setIsShared(newIsShared);
    setShareId(newShareId);
  };

  const handleToggleFavorite = async () => {
    setIsFavoriteLoading(true);
    try {
      const result = await toggleFavoriteAction(id);
      if (result.success && result.isFavorite !== undefined) {
        setIsFavorite(result.isFavorite);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  // Screen reader announcements
  const [announcement, setAnnouncement] = useState<string | null>(null);

  const handleToggleFavoriteWithAnnouncement = async () => {
    await handleToggleFavorite();
    setAnnouncement(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    setTimeout(() => setAnnouncement(null), 1000);
  };

  return (
    <>
      {/* Screen reader announcement */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
        {isFavoriteLoading && 'Updating favorite status...'}
      </div>

      <article
        className="group relative rounded-xl border bg-card p-4 shadow-soft transition-all duration-300 ease-smooth hover:shadow-soft-md hover:-translate-y-0.5 hover:border-primary/20 overflow-hidden"
        aria-labelledby={`content-title-${id}`}
      >
        {/* Type indicator bar */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5 ${
            type === 'note' ? 'bg-note' : type === 'link' ? 'bg-link' : 'bg-file'
          }`}
          aria-hidden="true"
        />

        <div className="flex items-start justify-between mb-2 pl-2">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize transition-colors ${
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
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              <time dateTime={createdAt.toISOString()}>{formatDateUTC(createdAt)}</time>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 transition-transform hover:scale-110"
              onClick={handleToggleFavoriteWithAnnouncement}
              disabled={isFavoriteLoading}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={isFavorite}
            >
              {isFavoriteLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
              ) : (
                <Star
                  className={`h-4 w-4 transition-colors ${
                    isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground hover:text-yellow-400'
                  }`}
                  aria-hidden="true"
                />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label="Content actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsShareDialogOpen(true)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  {isShared ? 'Manage Share' : 'Share'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsCollectionDialogOpen(true)}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Add to Collection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsRecommendationsDialogOpen(true)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  View Similar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <h3 id={`content-title-${id}`} className="font-semibold line-clamp-2 mb-2 pl-2">{title}</h3>

        {/* File preview for file type */}
        {type === 'file' && metadata?.filePath && (
          <div className="mb-3 pl-2">
            {metadata.fileType?.startsWith('image/') ? (
              <a
                href={metadata.filePath}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative h-32 w-full"
              >
                <NextImage
                  src={metadata.filePath}
                  alt={title}
                  fill
                  className="object-cover rounded-md"
                  sizes="(max-width: 640px) 100vw, 300px"
                />
              </a>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-md">
                {getFileIcon(metadata.fileType)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {metadata.fileName || title}
                  </p>
                  {metadata.fileSize && (
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(metadata.fileSize)}
                    </p>
                  )}
                </div>
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

        {body && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3 pl-2 leading-relaxed">
            {body}
          </p>
        )}

        {url && type !== 'file' && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-primary hover:underline mb-3 pl-2 truncate transition-colors"
          >
            {url}
          </a>
        )}

        <div className="pl-2">
          <EditableTags
          contentId={id}
          initialTags={tags}
          autoTags={autoTags}
          allTags={allTags}
        />
        </div>
      </article>

      <DeleteConfirmDialog
        contentId={id}
        contentTitle={title}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />

      <ContentEditDialog
        content={{ id, type, title, body, url }}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <ShareDialog
        contentId={id}
        contentTitle={title}
        isShared={isShared}
        shareId={shareId}
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        onShareStatusChange={handleShareStatusChange}
      />

      <CollectionSelector
        contentId={id}
        open={isCollectionDialogOpen}
        onOpenChange={setIsCollectionDialogOpen}
      />

      <RecommendationsDialog
        contentId={id}
        contentTitle={title}
        open={isRecommendationsDialogOpen}
        onOpenChange={setIsRecommendationsDialogOpen}
      />
    </>
  );
}
