import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMarketplaceListingAction, trackMarketplaceViewAction } from '@/app/actions/marketplace';
import { MarketplaceListingDetail } from '@/components/marketplace/MarketplaceListingDetail';

type Props = {
  params: Promise<{ listingId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { listingId } = await params;
  const result = await getMarketplaceListingAction(listingId);

  if (!result.success || !result.listing) {
    return {
      title: 'Listing Not Found - Mindweave Marketplace',
    };
  }

  const { listing } = result;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    title: `${listing.collection.name} - Mindweave Marketplace`,
    description:
      listing.description ||
      listing.collection.description ||
      `A curated collection of ${listing.contentCount} items on Mindweave.`,
    openGraph: {
      title: `${listing.collection.name} - Mindweave Marketplace`,
      description:
        listing.description ||
        listing.collection.description ||
        `A curated collection of ${listing.contentCount} items.`,
      type: 'website',
      url: `${baseUrl}/marketplace/${listing.id}`,
      siteName: 'Mindweave',
    },
    twitter: {
      card: 'summary',
      title: listing.collection.name,
      description:
        listing.description ||
        listing.collection.description ||
        `${listing.contentCount} curated items on Mindweave.`,
    },
  };
}

export default async function MarketplaceListingPage({ params }: Props) {
  const { listingId } = await params;
  const result = await getMarketplaceListingAction(listingId);

  if (!result.success || !result.listing) {
    notFound();
  }

  // Fire-and-forget view tracking
  trackMarketplaceViewAction(listingId);

  return <MarketplaceListingDetail listing={result.listing} />;
}
