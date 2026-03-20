import type { Metadata } from 'next';

const SITE_NAME = 'Mindweave';

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://www.mindweave.space';
}

interface SeoMetadataOptions {
  title: string;
  description: string;
  path: string;
  ogType?: 'website' | 'article' | 'profile';
}

export function generateSeoMetadata({
  title,
  description,
  path,
  ogType = 'website',
}: SeoMetadataOptions): Metadata {
  const fullTitle = `${title} - ${SITE_NAME}`;
  const url = `${getBaseUrl()}${path}`;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: ogType,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
    },
  };
}
