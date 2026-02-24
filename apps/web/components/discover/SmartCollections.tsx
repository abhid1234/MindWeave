'use client';

import { useState, useEffect } from 'react';
import { FolderPlus, Check, Loader2, FileText, Link as LinkIcon, File } from 'lucide-react';
import { DiscoverSection } from './DiscoverSection';
import { getClustersAction } from '@/app/actions/clusters';
import { createCollectionAction, bulkAddToCollectionAction } from '@/app/actions/collections';
import type { ContentCluster } from '@/lib/ai/clustering';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'note':
      return <FileText className="h-3 w-3 text-note" aria-hidden="true" />;
    case 'link':
      return <LinkIcon className="h-3 w-3 text-link" aria-hidden="true" />;
    default:
      return <File className="h-3 w-3 text-file" aria-hidden="true" />;
  }
}

function ClusterCard({
  cluster,
  onCreated,
}: {
  cluster: ContentCluster;
  onCreated: () => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const { addToast } = useToast();

  const handleCreateCollection = async () => {
    setIsCreating(true);
    try {
      const collectionResult = await createCollectionAction({
        name: cluster.name,
        description: cluster.description,
      });

      if (!collectionResult.success || !collectionResult.collection) {
        addToast({ variant: 'error', title: collectionResult.message });
        return;
      }

      const addResult = await bulkAddToCollectionAction(
        cluster.contentIds,
        collectionResult.collection.id
      );

      if (addResult.success) {
        setIsCreated(true);
        addToast({ variant: 'success', title: `Collection "${cluster.name}" created` });
        onCreated();
      } else {
        addToast({ variant: 'error', title: addResult.message });
      }
    } catch {
      addToast({ variant: 'error', title: 'Failed to create collection' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="rounded-lg border p-4 space-y-3" data-testid="cluster-card">
      <div>
        <h3 className="font-medium text-sm line-clamp-1">{cluster.name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {cluster.description}
        </p>
      </div>

      {/* Content previews */}
      <div className="space-y-1">
        {cluster.contentPreviews.slice(0, 3).map((preview) => (
          <div key={preview.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TypeIcon type={preview.type} />
            <span className="truncate">{preview.title}</span>
          </div>
        ))}
        {cluster.size > 3 && (
          <p className="text-xs text-muted-foreground">
            +{cluster.size - 3} more
          </p>
        )}
      </div>

      {/* Action button */}
      <Button
        variant={isCreated ? 'secondary' : 'outline'}
        size="sm"
        className="w-full"
        onClick={handleCreateCollection}
        disabled={isCreating || isCreated}
        data-testid="create-collection-btn"
      >
        {isCreated ? (
          <>
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Created
          </>
        ) : isCreating ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <FolderPlus className="mr-1.5 h-3.5 w-3.5" />
            Create Collection
          </>
        )}
      </Button>
    </div>
  );
}

export function SmartCollections() {
  const [isLoading, setIsLoading] = useState(true);
  const [clusters, setClusters] = useState<ContentCluster[]>([]);

  useEffect(() => {
    let cancelled = false;

    getClustersAction(5)
      .then((response) => {
        if (cancelled) return;
        if (response.success) {
          setClusters(response.clusters);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DiscoverSection
      title="Smart Collections"
      description="Auto-generated topic groups from your content — create collections in one click"
      icon={FolderPlus}
      isLoading={isLoading}
      isEmpty={clusters.length === 0}
    >
      {clusters.map((cluster) => (
        <ClusterCard
          key={cluster.id}
          cluster={cluster}
          onCreated={() => {}}
        />
      ))}
    </DiscoverSection>
  );
}
