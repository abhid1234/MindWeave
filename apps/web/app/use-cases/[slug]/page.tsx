import { notFound } from 'next/navigation';
import { useCasePages } from '../data';
import { LandingPageTemplate } from '@/components/seo/LandingPageTemplate';
import { JsonLd } from '@/components/seo/JsonLd';
import { generateSeoMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return Object.keys(useCasePages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = useCasePages[slug];
  if (!page) return {};
  return generateSeoMetadata({
    title: page.title,
    description: page.description,
    path: `/use-cases/${slug}`,
  });
}

export default async function UseCasePage({ params }: Props) {
  const { slug } = await params;
  const page = useCasePages[slug];
  if (!page) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.description,
    url: `https://www.mindweave.space/use-cases/${slug}`,
    about: { '@type': 'Thing', name: page.targetKeyword },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <LandingPageTemplate data={page} />
    </>
  );
}
