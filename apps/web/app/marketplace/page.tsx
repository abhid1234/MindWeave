import { Metadata } from 'next';
import { MarketplaceGrid } from '@/components/marketplace/MarketplaceGrid';
import { browseMarketplaceAction } from '@/app/actions/marketplace';

export const metadata: Metadata = {
  title: 'Marketplace - Mindweave',
  description:
    'Discover and clone curated knowledge collections from the Mindweave community. Programming, design, business, science, and more.',
  openGraph: {
    title: 'Knowledge Marketplace - Mindweave',
    description:
      'Discover and clone curated knowledge collections from the Mindweave community.',
    type: 'website',
  },
};

export default async function MarketplacePage() {
  // Prefetch initial listings server-side for SEO
  const result = await browseMarketplaceAction({
    sort: 'trending',
    page: 1,
    perPage: 12,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Knowledge Marketplace</h1>
        <p className="mt-1 text-muted-foreground">
          Discover curated collections from the community. Clone them to your library with one click.
        </p>
      </div>

      <MarketplaceGrid
        initialListings={result.success ? result.listings : undefined}
        initialTotal={result.success ? result.pagination.total : undefined}
      />
    </div>
  );
}
