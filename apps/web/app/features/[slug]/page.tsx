import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { LandingPageTemplate } from '@/components/seo/LandingPageTemplate';
import { featurePages } from '../data';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return Object.keys(featurePages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = featurePages[slug];
  if (!page) return {};

  return {
    title: page.title,
    description: page.description,
    keywords: [page.targetKeyword, 'Mindweave', 'knowledge management', 'AI notes'],
    alternates: { canonical: `https://www.mindweave.space/features/${slug}` },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `https://www.mindweave.space/features/${slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
    },
  };
}

export default async function FeaturePage({ params }: Props) {
  const { slug } = await params;
  const page = featurePages[slug];
  if (!page) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.description,
    url: `https://www.mindweave.space/features/${slug}`,
    about: { '@type': 'Thing', name: page.targetKeyword },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <LandingPageTemplate data={page} />
      <div className="container mx-auto px-4 pb-16 text-center">
        <Link href={page.docsLink} className="text-primary hover:underline">
          Learn more in the docs →
        </Link>
      </div>
    </>
  );
}
