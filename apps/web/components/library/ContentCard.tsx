import type { ContentType } from '@/lib/db/schema';
import { EditableTags } from './EditableTags';

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
  return (
    <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium capitalize">
          {type}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(createdAt).toLocaleDateString()}
        </span>
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
  );
}
