import type { Metadata } from 'next';
import Link from 'next/link';
import { Network } from 'lucide-react';
import { getPublicGraphAction } from '@/app/actions/public-graph';
import { PublicGraphViewer } from '@/components/graph/PublicGraphViewer';

interface PageProps {
  params: Promise<{ graphId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { graphId } = await params;
  const result = await getPublicGraphAction(graphId);

  if (!result.success || !result.data) {
    return { title: 'Not Found | Mindweave' };
  }

  const { title, description, graphData } = result.data;
  const desc = description || `${graphData.nodes.length} nodes, ${graphData.edges.length} connections`;

  return {
    title: `${title} | Mindweave`,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: 'website',
    },
  };
}

export default async function PublicGraphPage({ params }: PageProps) {
  const { graphId } = await params;
  const result = await getPublicGraphAction(graphId);

  if (!result.success || !result.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Not Found</h1>
          <p className="mt-2 text-muted-foreground">This graph doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const { title, description, graphData, createdAt } = result.data;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Network className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{title}</h1>
          </div>
          {description && <p className="text-muted-foreground">{description}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            {graphData.nodes.length} nodes, {graphData.edges.length} connections
            {' '}&middot; Created {new Date(createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Graph */}
        <div className="rounded-xl border border-border overflow-hidden" style={{ height: '600px' }}>
          <PublicGraphViewer graphData={graphData} />
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/dashboard/graph"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create Your Own Knowledge Graph
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            Powered by <Link href="/" className="text-primary hover:underline">Mindweave</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
