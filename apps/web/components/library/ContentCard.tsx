'use client';

import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { ContentType } from '@/lib/db/schema';
import { EditableTags } from './EditableTags';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { ContentEditDialog } from './ContentEditDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
};

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
}: ContentCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  return (
    <>
      <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-2">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium capitalize">
            {type}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {new Date(createdAt).toLocaleDateString()}
            </span>
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

        <h3 className="font-semibold line-clamp-2 mb-2">{title}</h3>

        {body && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {body}
          </p>
        )}

        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-primary hover:underline mb-3 truncate"
          >
            {url}
          </a>
        )}

        <EditableTags
          contentId={id}
          initialTags={tags}
          autoTags={autoTags}
          allTags={allTags}
        />
      </div>

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
    </>
  );
}
