'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Loader2, Layers, FileText, Link as LinkIcon, File } from 'lucide-react';
import Link from 'next/link';
import { getClustersAction, type ClusterResult } from '@/app/actions/clusters';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

type ContentCluster = ClusterResult['clusters'][number];

function getTypeIcon(type: string) {
  switch (type) {
    case 'note':
      return <FileText className="h-3 w-3" />;
    case 'link':
      return <LinkIcon className="h-3 w-3" />;
    case 'file':
      return <File className="h-3 w-3" />;
    default:
      return <FileText className="h-3 w-3" />;
  }
}

function ClusterItem({ cluster }: { cluster: ContentCluster }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-3 h-auto hover:bg-secondary/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">{cluster.name}</p>
              <p className="text-xs text-muted-foreground">
                {cluster.size} item{cluster.size !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-2">
        <p className="text-xs text-muted-foreground mb-2 pl-11">
          {cluster.description}
        </p>
        <div className="space-y-1 pl-11">
          {cluster.contentPreviews.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/library?contentId=${item.id}`}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              {getTypeIcon(item.type)}
              <span className="truncate">{item.title}</span>
            </Link>
          ))}
          {cluster.size > 5 && (
            <p className="text-xs text-muted-foreground/70 pl-5">
              +{cluster.size - 5} more
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ContentClusters() {
  const [clusters, setClusters] = useState<ContentCluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadClusters = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getClustersAction();

        if (cancelled) return;

        if (result.success) {
          setClusters(result.clusters);
        } else {
          setError(result.message || 'Failed to load clusters');
        }
      } catch (err) {
        if (!cancelled) {
          setError('An error occurred');
          console.error('Error loading clusters:', err);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadClusters();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold mb-3">Content Clusters</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold mb-3">Content Clusters</h3>
        <p className="text-sm text-muted-foreground text-center py-4">
          {error}
        </p>
      </div>
    );
  }

  if (clusters.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold mb-3">Content Clusters</h3>
        <p className="text-sm text-muted-foreground text-center py-4">
          Add more content to see automatic clusters
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="font-semibold mb-3">Content Clusters</h3>
      <p className="text-xs text-muted-foreground mb-3">
        AI-grouped content based on similarity
      </p>
      <div className="space-y-1">
        {clusters.map((cluster) => (
          <ClusterItem key={cluster.id} cluster={cluster} />
        ))}
      </div>
    </div>
  );
}
