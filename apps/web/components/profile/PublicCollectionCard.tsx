import Link from 'next/link';
import { Library } from 'lucide-react';

interface PublicCollectionCardProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    contentCount: number;
  };
  username: string;
}

export default function PublicCollectionCard({ collection, username }: PublicCollectionCardProps) {
  return (
    <Link
      href={`/profile/${username}/${collection.id}`}
      className="block rounded-lg border p-4 hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div
          className="rounded-lg p-2"
          style={{ backgroundColor: collection.color ? `${collection.color}20` : undefined }}
        >
          <Library
            className="h-5 w-5"
            style={{ color: collection.color ?? undefined }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{collection.name}</h3>
          {collection.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {collection.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {collection.contentCount} {collection.contentCount === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>
    </Link>
  );
}
