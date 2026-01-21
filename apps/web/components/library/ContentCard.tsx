import type { ContentType } from '@/lib/db/schema';

export type ContentCardProps = {
  id: string;
  type: ContentType;
  title: string;
  body: string | null;
  url: string | null;
  tags: string[];
  autoTags: string[];
  createdAt: Date;
};

export function ContentCard({
  type,
  title,
  body,
  url,
  tags,
  autoTags,
  createdAt,
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

      {(tags.length > 0 || autoTags.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
            >
              {tag}
            </span>
          ))}
          {autoTags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2 py-0.5 text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
