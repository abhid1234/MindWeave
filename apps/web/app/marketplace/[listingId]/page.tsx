import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getMarketplaceListingAction, trackMarketplaceViewAction } from '@/app/actions/marketplace';
import { getSocialProofStats } from '@/app/actions/social-proof';
import { MarketplaceListingDetail } from '@/components/marketplace/MarketplaceListingDetail';
import { JsonLd } from '@/components/seo/JsonLd';
import { ContextualCTA } from '@/components/growth/ContextualCTA';
import { SignupBanner } from '@/components/growth/SignupBanner';
import { ShareButton } from '@/components/growth/ShareButton';

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
      images: [`${baseUrl}/opengraph-image`],
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
  const [session, result, stats] = await Promise.all([
    auth(),
    getMarketplaceListingAction(listingId),
    getSocialProofStats(),
  ]);

  if (!result.success || !result.listing) {
    notFound();
  }

  // Fire-and-forget view tracking
  trackMarketplaceViewAction(listingId);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const { listing } = result;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.collection.name,
    description:
      listing.description ||
      listing.collection.description ||
      `A curated collection of ${listing.contentCount} items on Mindweave.`,
    url: `${baseUrl}/marketplace/${listing.id}`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  const pageUrl = `${baseUrl}/marketplace/${listing.id}`;

  return (
    <>
      <JsonLd data={productJsonLd} />
      {/* Server-rendered H1 for SEO — the client component renders a visible H1 below */}
      <h1 className="sr-only">{listing.collection.name}</h1>
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <ShareButton url={pageUrl} title={listing.collection.name} />
        </div>
        <MarketplaceListingDetail listing={listing} />
        {!session?.user && <ContextualCTA variant="marketplace" />}
      </div>
      {!session?.user && stats?.data && <SignupBanner userCount={stats.data.userCount} />}
    </>
  );
}
