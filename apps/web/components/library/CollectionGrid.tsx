'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Library, MoreHorizontal, Pencil, Trash2, Plus, FolderOpen, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CollectionDialog } from './CollectionDialog';
import { ShareCollectionDialog } from './ShareCollectionDialog';
import { getCollectionsAction, deleteCollectionAction } from '@/app/actions/collections';
import { useToast } from '@/components/ui/toast';

type CollectionWithCount = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
  contentCount: number;
};

export function CollectionGrid() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [collections, setCollections] = useState<CollectionWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionWithCount | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharingCollection, setSharingCollection] = useState<CollectionWithCount | null>(null);

  const fetchCollections = useCallback(async () => {
    const result = await getCollectionsAction();
    if (result.success) {
      setCollections(result.collections);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleCollectionClick = (collectionId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('tab');
    params.set('collectionId', collectionId);
    router.push(`/dashboard/library?${params.toString()}`);
  };

  const handleEdit = (collection: CollectionWithCount) => {
    setEditingCollection(collection);
    setDialogOpen(true);
  };

  const handleDelete = async (collectionId: string) => {
    const result = await deleteCollectionAction(collectionId);
    if (result.success) {
      addToast({ variant: 'success', title: 'Collection deleted' });
      fetchCollections();
    } else {
      addToast({ variant: 'error', title: result.message });
    }
  };

  const handleCreateNew = () => {
    setEditingCollection(null);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    fetchCollections();
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl border bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {collections.length} collection{collections.length !== 1 ? 's' : ''}
        </span>
        <Button size="sm" onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Collection
        </Button>
      </div>

      {collections.length === 0 ? (
        <div className="rounded-xl border border-dashed p-16 text-center animate-in fade-in-50 duration-300">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FolderOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No collections yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Create collections to organize your content into groups.
          </p>
          <Button className="mt-6" onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Collection
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection, index) => (
            <article
              key={collection.id}
              className="group relative flex flex-col rounded-xl border bg-card p-4 shadow-soft transition-all duration-300 ease-smooth hover:shadow-soft-md hover:-translate-y-0.5 hover:border-primary/20 overflow-hidden cursor-pointer h-36 animate-in fade-in-50 slide-in-from-bottom-4 duration-300"
              style={{ animationDelay: `${Math.min(index * 50, 300)}ms`, animationFillMode: 'backwards' }}
              onClick={() => handleCollectionClick(collection.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCollectionClick(collection.id);
                }
              }}
            >
              {/* Color accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5"
                style={{ backgroundColor: collection.color || 'hsl(var(--muted-foreground))' }}
                aria-hidden="true"
              />

              <div className="flex items-start justify-between pl-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Library className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <h3 className="font-semibold line-clamp-1">{collection.name}</h3>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Collection actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => handleEdit(collection)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSharingCollection(collection);
                      setShareDialogOpen(true);
                    }}>
                      <Users className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(collection.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {collection.description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2 pl-2">
                  {collection.description}
                </p>
              )}

              <div className="mt-auto pl-2">
                <span className="text-xs text-muted-foreground">
                  {collection.contentCount} item{collection.contentCount !== 1 ? 's' : ''}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      <CollectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        collection={editingCollection}
        onSuccess={handleDialogSuccess}
      />

      {sharingCollection && (
        <ShareCollectionDialog
          collectionId={sharingCollection.id}
          collectionName={sharingCollection.name}
          isOwner={true}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
        />
      )}
    </>
  );
}
