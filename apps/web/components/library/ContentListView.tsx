'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Check, MoreHorizontal, Pencil, Trash2, Share2, FolderPlus, Star, Loader2, Sparkles } from 'lucide-react';
import type { ContentType } from '@/lib/db/schema';
import { formatDateUTC } from '@/lib/utils';
import { toggleFavoriteAction } from '@/app/actions/content';
import { useBulkSelection } from './BulkSelectionContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/toast';

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
const ContentDetailDialog = dynamic(
  () => import('./ContentDetailDialog').then((mod) => mod.ContentDetailDialog),
  { loading: () => null }
);

type ContentItem = {
  id: string;
  type: ContentType;
  title: string;
  body: string | null;
  url: string | null;
  tags: string[];
  autoTags: string[];
  createdAt: Date;
  metadata: {
    fileType?: string;
    fileSize?: number;
    filePath?: string;
    fileName?: string;
    [key: string]: unknown;
  } | null;
  isShared: boolean;
  shareId: string | null;
  isFavorite: boolean;
  summary?: string | null;
};

type ContentListViewProps = {
  items: ContentItem[];
  allTags: string[];
};

function ListRow({ item, allTags: _allTags }: { item: ContentItem; allTags: string[] }) {
  const { isSelectionMode, toggleSelection, isSelected } = useBulkSelection();
  const selected = isSelected(item.id);
  const { addToast } = useToast();

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(item.isFavorite);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isShared, setIsShared] = useState(item.isShared);
  const [shareId, setShareId] = useState(item.shareId);

  const handleClick = () => {
    if (isSelectionMode) {
      toggleSelection(item.id);
    } else {
      setIsDetailOpen(true);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavoriteLoading(true);
    try {
      const result = await toggleFavoriteAction(item.id);
      if (result.success && result.isFavorite !== undefined) {
        setIsFavorite(result.isFavorite);
        addToast({ variant: 'success', title: result.isFavorite ? 'Added to favorites' : 'Removed from favorites' });
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const displayTags = [...item.tags, ...item.autoTags].slice(0, 2);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-accent/50 ${
          selected ? 'ring-2 ring-primary ring-offset-2 bg-primary/5' : ''
        }`}
      >
        {/* Selection checkbox */}
        {isSelectionMode && (
          <div
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition-all ${
              selected ? 'bg-primary text-primary-foreground' : 'border-2 border-muted-foreground/30'
            }`}
          >
            {selected && <Check className="h-3 w-3" />}
          </div>
        )}

        {/* Type badge */}
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
          item.type === 'note'
            ? 'bg-note/10 text-note dark:bg-note/20'
            : item.type === 'link'
              ? 'bg-link/10 text-link dark:bg-link/20'
              : 'bg-file/10 text-file dark:bg-file/20'
        }`}>
          {item.type}
        </span>

        {/* Title */}
        <span className="flex-1 min-w-0 truncate font-medium text-sm">
          {item.title}
        </span>

        {/* Tags (hidden on mobile) */}
        {displayTags.length > 0 && (
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            {displayTags.map((tag) => (
              <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Date */}
        <time className="shrink-0 text-xs text-muted-foreground hidden sm:block" dateTime={item.createdAt.toISOString()}>
          {formatDateUTC(item.createdAt)}
        </time>

        {/* Favorite */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={handleToggleFavorite}
          disabled={isFavoriteLoading}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavoriteLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : (
            <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
          )}
        </Button>

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 shrink-0"
              onClick={(e) => e.stopPropagation()}
              aria-label="Content actions"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsShareOpen(true)}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsCollectionOpen(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Add to Collection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsRecommendationsOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              View Similar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsDeleteOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialogs */}
      <ContentDetailDialog
        content={{
          id: item.id,
          type: item.type,
          title: item.title,
          body: item.body,
          url: item.url,
          tags: item.tags,
          autoTags: item.autoTags,
          createdAt: item.createdAt,
          isFavorite,
          isShared,
          shareId,
          metadata: item.metadata,
          summary: item.summary,
        }}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
      <DeleteConfirmDialog
        contentId={item.id}
        contentTitle={item.title}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
      <ContentEditDialog
        content={{ id: item.id, type: item.type, title: item.title, body: item.body, url: item.url, metadata: item.metadata }}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
      <ShareDialog
        contentId={item.id}
        contentTitle={item.title}
        isShared={isShared}
        shareId={shareId}
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        onShareStatusChange={(newIsShared, newShareId) => {
          setIsShared(newIsShared);
          setShareId(newShareId);
        }}
      />
      <CollectionSelector
        contentId={item.id}
        open={isCollectionOpen}
        onOpenChange={setIsCollectionOpen}
      />
      <RecommendationsDialog
        contentId={item.id}
        contentTitle={item.title}
        open={isRecommendationsOpen}
        onOpenChange={setIsRecommendationsOpen}
      />
    </>
  );
}

export function ContentListView({ items, allTags }: ContentListViewProps) {
  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="animate-in fade-in-50 slide-in-from-bottom-4 duration-300"
          style={{ animationDelay: `${Math.min(index * 30, 300)}ms`, animationFillMode: 'backwards' }}
        >
          <ListRow item={item} allTags={allTags} />
        </div>
      ))}
    </div>
  );
}
