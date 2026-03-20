import { MetadataRoute } from 'next';
import { db } from '@/lib/db/client';
import { tilPosts, marketplaceListings, publicGraphs, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const revalidate = 3600;

const useCaseSlugs = [
  'ai-note-taking',
  'second-brain',
  'researchers',
  'developers',
  'students',
  'open-source',
];
const featureSlugs = ['semantic-search', 'ai-tagging', 'knowledge-qa'];
const compareSlugs = ['notion', 'obsidian', 'evernote'];

async function getTilEntries(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  try {
    const posts = await db
      .select({ id: tilPosts.id, publishedAt: tilPosts.publishedAt })
      .from(tilPosts);
    return posts.map((post) => ({
      url: `${baseUrl}/til/${post.id}`,
      lastModified: post.publishedAt,
    }));
  } catch {
    return [];
  }
}

async function getMarketplaceEntries(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  try {
    const listings = await db
      .select({ id: marketplaceListings.id, updatedAt: marketplaceListings.updatedAt })
      .from(marketplaceListings);
    return listings.map((listing) => ({
      url: `${baseUrl}/marketplace/${listing.id}`,
      lastModified: listing.updatedAt,
    }));
  } catch {
    return [];
  }
}

async function getPublicGraphEntries(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  try {
    const graphs = await db
      .select({ graphId: publicGraphs.graphId, createdAt: publicGraphs.createdAt })
      .from(publicGraphs);
    return graphs.map((graph) => ({
      url: `${baseUrl}/graph/${graph.graphId}`,
      lastModified: graph.createdAt,
    }));
  } catch {
    return [];
  }
}

async function getPublicProfileEntries(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  try {
    const publicUsers = await db
      .select({ username: users.username, updatedAt: users.updatedAt })
      .from(users)
      .where(eq(users.isProfilePublic, true));
    return publicUsers
      .filter((u): u is { username: string; updatedAt: Date } => u.username !== null)
      .map((u) => ({
        url: `${baseUrl}/u/${u.username}`,
        lastModified: u.updatedAt,
      }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now },
    { url: `${baseUrl}/login`, lastModified: now },
    { url: `${baseUrl}/register`, lastModified: now },
    { url: `${baseUrl}/blog`, lastModified: now },
    { url: `${baseUrl}/support`, lastModified: now },
    { url: `${baseUrl}/privacy`, lastModified: now },
    { url: `${baseUrl}/terms`, lastModified: now },
    { url: `${baseUrl}/til`, lastModified: now },
    { url: `${baseUrl}/marketplace`, lastModified: now },
    ...useCaseSlugs.map((slug) => ({ url: `${baseUrl}/use-cases/${slug}`, lastModified: now })),
    ...featureSlugs.map((slug) => ({ url: `${baseUrl}/features/${slug}`, lastModified: now })),
    ...compareSlugs.map((slug) => ({ url: `${baseUrl}/compare/${slug}`, lastModified: now })),
    // Legacy docs pages
    { url: `${baseUrl}/docs`, lastModified: now },
    { url: `${baseUrl}/docs/getting-started`, lastModified: now },
    { url: `${baseUrl}/docs/features`, lastModified: now },
    { url: `${baseUrl}/docs/features/capture`, lastModified: now },
    { url: `${baseUrl}/docs/features/library`, lastModified: now },
    { url: `${baseUrl}/docs/features/tagging`, lastModified: now },
    { url: `${baseUrl}/docs/features/search`, lastModified: now },
    { url: `${baseUrl}/docs/features/ask`, lastModified: now },
    { url: `${baseUrl}/docs/features/collections`, lastModified: now },
    { url: `${baseUrl}/docs/features/analytics`, lastModified: now },
    { url: `${baseUrl}/docs/account`, lastModified: now },
    { url: `${baseUrl}/docs/faq`, lastModified: now },
  ];

  const [tilEntries, marketplaceEntries, publicGraphEntries, publicProfileEntries] =
    await Promise.all([
      getTilEntries(baseUrl),
      getMarketplaceEntries(baseUrl),
      getPublicGraphEntries(baseUrl),
      getPublicProfileEntries(baseUrl),
    ]);

  return [
    ...staticEntries,
    ...tilEntries,
    ...marketplaceEntries,
    ...publicGraphEntries,
    ...publicProfileEntries,
  ];
}
