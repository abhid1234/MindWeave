import type { Metadata } from 'next';
import Link from 'next/link';
import { Network, Linkedin, ExternalLink } from 'lucide-react';
import { getPublicGraphAction } from '@/app/actions/public-graph';
import { PublicGraphViewer } from '@/components/graph/PublicGraphViewer';

const TYPE_COLORS: Record<string, string> = {
  note: '#3b82f6',
  link: '#22c55e',
  file: '#f97316',
};

const COMMUNITY_COLORS = [
  '#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6',
  '#22c55e', '#ef4444', '#06b6d4', '#eab308', '#64748b',
];

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
  const stats = graphData.stats;
  const nodeCount = stats?.nodeCount ?? graphData.nodes.length;
  const edgeCount = stats?.edgeCount ?? graphData.edges.length;
  const desc = description || `${nodeCount} nodes, ${edgeCount} connections`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mindweave.app';
  const ogImageUrl = `${appUrl}/api/og/graph?id=${graphId}`;

  return {
    title: `${title} | Mindweave`,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${title} - Knowledge Graph`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [ogImageUrl],
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

  const { title, description, graphData, settings, createdAt } = result.data;
  const stats = graphData.stats;
  const nodeCount = stats?.nodeCount ?? graphData.nodes.length;
  const edgeCount = stats?.edgeCount ?? graphData.edges.length;
  const communityCount = stats?.communityCount ?? 0;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mindweave.app';
  const shareUrl = `${appUrl}/graph/${graphId}`;
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

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
            Created {new Date(createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Stats Bar */}
        <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{nodeCount}</span> nodes
          <span className="opacity-40">&middot;</span>
          <span className="font-medium text-foreground">{edgeCount}</span> connections
          {communityCount > 0 && (
            <>
              <span className="opacity-40">&middot;</span>
              <span className="font-medium text-foreground">{communityCount}</span> communities
            </>
          )}
        </div>

        {/* Graph */}
        <div className="rounded-xl border border-border overflow-hidden" style={{ height: '600px' }}>
          <PublicGraphViewer graphData={graphData} settings={settings} />
        </div>

        {/* Legends */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-y-2">
          {/* Type Legend */}
          <div className="flex items-center gap-3">
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div
                  className="h-3 w-3 rounded-full border-2"
                  style={{ borderColor: color, backgroundColor: 'transparent' }}
                />
                <span className="capitalize">{type}</span>
              </div>
            ))}
          </div>

          {/* Community Legend */}
          {communityCount > 1 && (
            <div className="flex items-center gap-2">
              <span className="opacity-60">Communities:</span>
              {COMMUNITY_COLORS.slice(0, Math.min(communityCount, 10)).map((color, i) => (
                <div
                  key={i}
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: color }}
                  title={`Community ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/dashboard/graph"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create Your Own Knowledge Graph
            </Link>
            <a
              href={linkedInShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
            >
              <Linkedin className="h-4 w-4" />
              Share on LinkedIn
              <ExternalLink className="h-3 w-3 opacity-50" />
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            Powered by <Link href="/" className="text-primary hover:underline">Mindweave</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
