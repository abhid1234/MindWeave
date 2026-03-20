import { notFound } from 'next/navigation';
import { comparePages } from '../data';
import { LandingPageTemplate } from '@/components/seo/LandingPageTemplate';
import { ComparisonTable } from '@/components/seo/ComparisonTable';
import { JsonLd } from '@/components/seo/JsonLd';
import { generateSeoMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return Object.keys(comparePages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = comparePages[slug];
  if (!page) return {};
  return generateSeoMetadata({
    title: page.title,
    description: page.description,
    path: `/compare/${slug}`,
  });
}

export default async function ComparePage({ params }: Props) {
  const { slug } = await params;
  const page = comparePages[slug];
  if (!page) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.description,
    url: `https://www.mindweave.space/compare/${slug}`,
    about: { '@type': 'Thing', name: page.targetKeyword },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <LandingPageTemplate data={page} />
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight md:text-4xl">
            Feature Comparison
          </h2>
          <div className="mx-auto max-w-3xl">
            <ComparisonTable
              competitor={page.comparison.competitor}
              features={page.comparison.features}
            />
          </div>
        </div>
      </section>
    </>
  );
}
