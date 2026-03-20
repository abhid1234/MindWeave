# SEO Infrastructure & Keyword Landing Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish Mindweave's organic search presence with SEO infrastructure (sitemap, robots, JSON-LD, meta helpers) and 12 keyword-targeted landing pages.

**Architecture:** Static landing pages via dynamic `[slug]` routes with `generateStaticParams`. Shared `JsonLd` and `LandingPageTemplate` components. Async sitemap with ISR caching for dynamic content. No database schema changes.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, Drizzle ORM (sitemap queries only), Vitest + React Testing Library

**Spec:** `docs/superpowers/specs/2026-03-19-seo-infrastructure-design.md`

---

## File Structure Overview

### New Files

```
apps/web/
├── app/
│   ├── use-cases/
│   │   ├── [slug]/page.tsx
│   │   ├── [slug]/opengraph-image.tsx
│   │   └── data.ts
│   ├── features/
│   │   ├── [slug]/page.tsx
│   │   ├── [slug]/opengraph-image.tsx
│   │   └── data.ts
│   ├── compare/
│   │   ├── [slug]/page.tsx
│   │   ├── [slug]/opengraph-image.tsx
│   │   └── data.ts
│   ├── blog/page.tsx
│   └── til/feed/route.ts
├── components/seo/
│   ├── JsonLd.tsx
│   ├── JsonLd.test.tsx
│   ├── LandingPageTemplate.tsx
│   ├── LandingPageTemplate.test.tsx
│   ├── ComparisonTable.tsx
│   └── ComparisonTable.test.tsx
└── lib/seo/
    ├── metadata.ts
    └── metadata.test.ts
```

### Modified Files

```
apps/web/app/sitemap.ts              # Migrate to async with dynamic content
apps/web/app/robots.ts               # Add /onboarding, /.well-known/ blocks
apps/web/app/page.tsx                # Add footer links to new pages
apps/web/app/til/[tilId]/page.tsx    # Add Article JSON-LD
apps/web/app/marketplace/[listingId]/page.tsx  # Add Product JSON-LD
apps/web/app/profile/[username]/page.tsx       # Add Person JSON-LD
apps/web/app/docs/faq/page.tsx       # Add FAQPage JSON-LD
apps/web/app/docs/layout.tsx         # Add BreadcrumbList JSON-LD
```

---

## Task 1: SEO Metadata Helper

**Files:**
- Create: `apps/web/lib/seo/metadata.ts`
- Create: `apps/web/lib/seo/metadata.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/web/lib/seo/metadata.test.ts
import { describe, it, expect } from 'vitest';
import { generateSeoMetadata } from './metadata';

describe('generateSeoMetadata', () => {
  it('should generate metadata with title and description', () => {
    const result = generateSeoMetadata({
      title: 'AI Note Taking App',
      description: 'Take notes with AI assistance',
      path: '/use-cases/ai-note-taking',
    });

    expect(result.title).toBe('AI Note Taking App - Mindweave');
    expect(result.description).toBe('Take notes with AI assistance');
    expect(result.alternates?.canonical).toBe('https://www.mindweave.space/use-cases/ai-note-taking');
  });

  it('should include openGraph metadata', () => {
    const result = generateSeoMetadata({
      title: 'AI Note Taking App',
      description: 'Take notes with AI assistance',
      path: '/use-cases/ai-note-taking',
    });

    expect(result.openGraph?.title).toBe('AI Note Taking App - Mindweave');
    expect(result.openGraph?.description).toBe('Take notes with AI assistance');
    expect(result.openGraph?.url).toBe('https://www.mindweave.space/use-cases/ai-note-taking');
    expect(result.openGraph?.siteName).toBe('Mindweave');
    expect(result.openGraph?.type).toBe('website');
  });

  it('should include twitter card metadata', () => {
    const result = generateSeoMetadata({
      title: 'AI Note Taking App',
      description: 'Take notes with AI assistance',
      path: '/use-cases/ai-note-taking',
    });

    expect(result.twitter?.card).toBe('summary_large_image');
    expect(result.twitter?.title).toBe('AI Note Taking App - Mindweave');
    expect(result.twitter?.description).toBe('Take notes with AI assistance');
  });

  it('should allow custom OG type', () => {
    const result = generateSeoMetadata({
      title: 'Test',
      description: 'Test',
      path: '/test',
      ogType: 'article',
    });

    expect(result.openGraph?.type).toBe('article');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run lib/seo/metadata.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// apps/web/lib/seo/metadata.ts
import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.mindweave.space';
const SITE_NAME = 'Mindweave';

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
  const url = `${BASE_URL}${path}`;

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run lib/seo/metadata.test.ts`
Expected: PASS — all 4 tests

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/seo/metadata.ts apps/web/lib/seo/metadata.test.ts
git commit -m "feat(seo): add metadata helper for consistent SEO tags"
```

---

## Task 2: JsonLd Component

**Files:**
- Create: `apps/web/components/seo/JsonLd.tsx`
- Create: `apps/web/components/seo/JsonLd.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/web/components/seo/JsonLd.test.tsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { JsonLd } from './JsonLd';

describe('JsonLd', () => {
  it('should render a script tag with application/ld+json type', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Test Page',
    };

    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
  });

  it('should contain the correct JSON data', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Test Article',
      author: { '@type': 'Person', name: 'Test Author' },
    };

    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script!.innerHTML);
    expect(parsed['@type']).toBe('Article');
    expect(parsed.headline).toBe('Test Article');
    expect(parsed.author.name).toBe('Test Author');
  });

  it('should handle FAQPage schema', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Mindweave?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'An AI knowledge hub.',
          },
        },
      ],
    };

    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script!.innerHTML);
    expect(parsed['@type']).toBe('FAQPage');
    expect(parsed.mainEntity).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run components/seo/JsonLd.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// apps/web/components/seo/JsonLd.tsx
interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run components/seo/JsonLd.test.tsx`
Expected: PASS — all 3 tests

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/seo/JsonLd.tsx apps/web/components/seo/JsonLd.test.tsx
git commit -m "feat(seo): add reusable JsonLd component for structured data"
```

---

## Task 3: Update robots.ts

**Files:**
- Modify: `apps/web/app/robots.ts`

- [ ] **Step 1: Update robots.ts**

Replace the existing content of `apps/web/app/robots.ts` with:

```typescript
import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.mindweave.space';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/embed/', '/share/'],
        disallow: ['/api/', '/dashboard/', '/onboarding', '/.well-known/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

- [ ] **Step 2: Verify build**

Run: `cd apps/web && pnpm build 2>&1 | head -30`
Expected: Build succeeds without errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/robots.ts
git commit -m "fix(seo): add onboarding and .well-known to robots.txt disallow"
```

---

## Task 4: Migrate Sitemap to Async with Dynamic Content

**Files:**
- Modify: `apps/web/app/sitemap.ts`

- [ ] **Step 1: Replace sitemap.ts with async version**

Replace `apps/web/app/sitemap.ts` with a version that:
- Keeps all existing static entries
- Adds new static entries for `/use-cases/*`, `/features/*`, `/compare/*`, `/blog`, `/support`, `/privacy`, `/terms`
- Queries the database for dynamic content: TIL posts (`tilPosts`), marketplace listings (`marketplaceListings`), public graphs (`publicGraphs`), public profiles (`users` where `isProfilePublic = true`)
- Wraps dynamic queries in try/catch — returns empty arrays if DB is unreachable
- Uses `export const revalidate = 3600` for ISR caching

```typescript
import type { MetadataRoute } from 'next';
import { db } from '@/lib/db/client';
import { tilPosts, marketplaceListings, publicGraphs, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const revalidate = 3600;

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.mindweave.space';

const useCaseSlugs = ['ai-note-taking', 'second-brain', 'researchers', 'developers', 'students', 'open-source'];
const featureSlugs = ['semantic-search', 'ai-tagging', 'knowledge-qa'];
const compareSlugs = ['notion', 'obsidian', 'evernote'];

async function getDynamicEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const [tils, listings, graphs, profiles] = await Promise.all([
      db.select({ id: tilPosts.id, publishedAt: tilPosts.publishedAt }).from(tilPosts),
      db.select({ id: marketplaceListings.id, publishedAt: marketplaceListings.publishedAt }).from(marketplaceListings),
      db.select({ graphId: publicGraphs.graphId, createdAt: publicGraphs.createdAt }).from(publicGraphs),
      db.select({ username: users.username }).from(users).where(eq(users.isProfilePublic, true)),
    ]);

    return [
      ...tils.map((t) => ({
        url: `${baseUrl}/til/${t.id}`,
        lastModified: t.publishedAt ?? undefined,
      })),
      ...listings.map((l) => ({
        url: `${baseUrl}/marketplace/${l.id}`,
        lastModified: l.publishedAt ?? undefined,
      })),
      ...graphs.map((g) => ({
        url: `${baseUrl}/graph/${g.graphId}`,
        lastModified: g.createdAt ?? undefined,
      })),
      ...profiles.filter((p) => p.username).map((p) => ({
        url: `${baseUrl}/profile/${p.username}`,
      })),
    ];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dynamicEntries = await getDynamicEntries();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/login` },
    { url: `${baseUrl}/register` },
    { url: `${baseUrl}/docs` },
    { url: `${baseUrl}/docs/getting-started` },
    { url: `${baseUrl}/docs/features` },
    { url: `${baseUrl}/docs/features/capture` },
    { url: `${baseUrl}/docs/features/library` },
    { url: `${baseUrl}/docs/features/tagging` },
    { url: `${baseUrl}/docs/features/search` },
    { url: `${baseUrl}/docs/features/ask` },
    { url: `${baseUrl}/docs/features/collections` },
    { url: `${baseUrl}/docs/features/analytics` },
    { url: `${baseUrl}/docs/account` },
    { url: `${baseUrl}/docs/faq` },
    { url: `${baseUrl}/privacy` },
    { url: `${baseUrl}/terms` },
    { url: `${baseUrl}/support` },
    { url: `${baseUrl}/blog` },
    { url: `${baseUrl}/til` },
    { url: `${baseUrl}/marketplace` },
    ...useCaseSlugs.map((slug) => ({ url: `${baseUrl}/use-cases/${slug}` })),
    ...featureSlugs.map((slug) => ({ url: `${baseUrl}/features/${slug}` })),
    ...compareSlugs.map((slug) => ({ url: `${baseUrl}/compare/${slug}` })),
  ];

  return [...staticEntries, ...dynamicEntries];
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `cd apps/web && pnpm type-check`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/sitemap.ts
git commit -m "feat(seo): migrate sitemap to async with dynamic TIL, marketplace, profile entries"
```

---

## Task 5: LandingPageTemplate Component

**Files:**
- Create: `apps/web/components/seo/LandingPageTemplate.tsx`
- Create: `apps/web/components/seo/LandingPageTemplate.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/web/components/seo/LandingPageTemplate.test.tsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingPageTemplate } from './LandingPageTemplate';

const mockData = {
  hero: {
    title: 'AI Note Taking App',
    subtitle: 'Capture and organize with AI',
    cta: { text: 'Start Free', href: '/login' },
  },
  problem: {
    title: 'The problem with manual note taking',
    paragraphs: ['Notes get lost.', 'Finding them is hard.'],
  },
  solution: {
    title: 'Mindweave solves this',
    description: 'AI auto-tags and organizes everything.',
  },
  features: [
    { icon: 'Sparkles', title: 'AI Tagging', description: 'Auto-tag with Gemini' },
    { icon: 'Search', title: 'Semantic Search', description: 'Search by meaning' },
  ],
  socialProof: {
    githubStars: 4,
    testCount: '2,675+',
  },
};

describe('LandingPageTemplate', () => {
  it('should render the hero title', () => {
    render(<LandingPageTemplate data={mockData} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AI Note Taking App');
  });

  it('should render the CTA button', () => {
    render(<LandingPageTemplate data={mockData} />);
    expect(screen.getByRole('link', { name: /start free/i })).toHaveAttribute('href', '/login');
  });

  it('should render problem section', () => {
    render(<LandingPageTemplate data={mockData} />);
    expect(screen.getByText('The problem with manual note taking')).toBeInTheDocument();
    expect(screen.getByText('Notes get lost.')).toBeInTheDocument();
  });

  it('should render feature cards', () => {
    render(<LandingPageTemplate data={mockData} />);
    expect(screen.getByText('AI Tagging')).toBeInTheDocument();
    expect(screen.getByText('Semantic Search')).toBeInTheDocument();
  });

  it('should render social proof', () => {
    render(<LandingPageTemplate data={mockData} />);
    expect(screen.getByText(/2,675\+/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run components/seo/LandingPageTemplate.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

Build `LandingPageTemplate.tsx` as a server component that renders:
- Hero section with H1, subtitle, CTA link styled like the main landing page buttons
- Problem section with H2 and paragraphs
- Solution section with H2 and description
- Feature grid (2-col on desktop) with lucide icons, titles, descriptions
- Social proof bar (GitHub stars, test count, open source badge)
- Bottom CTA section

Use Tailwind classes matching the existing landing page style (check `apps/web/app/page.tsx` for class patterns like `text-gradient`, `btn-press`, `shadow-soft-md`).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run components/seo/LandingPageTemplate.test.tsx`
Expected: PASS — all 5 tests

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/seo/LandingPageTemplate.tsx apps/web/components/seo/LandingPageTemplate.test.tsx
git commit -m "feat(seo): add LandingPageTemplate component for keyword pages"
```

---

## Task 6: ComparisonTable Component

**Files:**
- Create: `apps/web/components/seo/ComparisonTable.tsx`
- Create: `apps/web/components/seo/ComparisonTable.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/web/components/seo/ComparisonTable.test.tsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComparisonTable } from './ComparisonTable';

const mockData = {
  competitor: 'Notion',
  features: [
    { name: 'Semantic Search', mindweave: true, competitor: false },
    { name: 'AI Auto-Tagging', mindweave: true, competitor: false },
    { name: 'Note Taking', mindweave: true, competitor: true },
  ],
};

describe('ComparisonTable', () => {
  it('should render the competitor name in the header', () => {
    render(<ComparisonTable {...mockData} />);
    expect(screen.getByText('Notion')).toBeInTheDocument();
    expect(screen.getByText('Mindweave')).toBeInTheDocument();
  });

  it('should render all feature rows', () => {
    render(<ComparisonTable {...mockData} />);
    expect(screen.getByText('Semantic Search')).toBeInTheDocument();
    expect(screen.getByText('AI Auto-Tagging')).toBeInTheDocument();
    expect(screen.getByText('Note Taking')).toBeInTheDocument();
  });

  it('should render check and x icons for feature support', () => {
    render(<ComparisonTable {...mockData} />);
    const rows = screen.getAllByRole('row');
    // Header row + 3 feature rows = 4
    expect(rows).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run components/seo/ComparisonTable.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

Build `ComparisonTable.tsx` using a `<table>` with:
- Header row: Feature | Mindweave | {Competitor}
- Feature rows with lucide `Check` (green) and `X` (red/muted) icons
- Styled with Tailwind matching the existing comparison table on the landing page (`apps/web/app/page.tsx` lines ~600-630)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run components/seo/ComparisonTable.test.tsx`
Expected: PASS — all 3 tests

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/seo/ComparisonTable.tsx apps/web/components/seo/ComparisonTable.test.tsx
git commit -m "feat(seo): add ComparisonTable component for competitor pages"
```

---

## Task 7: Use-Case Landing Pages (6 pages)

**Files:**
- Create: `apps/web/app/use-cases/data.ts`
- Create: `apps/web/app/use-cases/[slug]/page.tsx`
- Create: `apps/web/app/use-cases/[slug]/opengraph-image.tsx`

- [ ] **Step 1: Create the data file**

Create `apps/web/app/use-cases/data.ts` exporting a `useCasePages` record keyed by slug. Each entry contains: `title`, `description`, `targetKeyword`, `hero` (title, subtitle, cta), `problem` (title, paragraphs), `solution` (title, description), `features` (array of icon/title/description), `socialProof`, and `relatedLinks` (cross-links to other landing pages and docs).

Define all 6 slugs: `ai-note-taking`, `second-brain`, `researchers`, `developers`, `students`, `open-source`.

- [ ] **Step 2: Create the page component**

Create `apps/web/app/use-cases/[slug]/page.tsx`:

```typescript
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
```

- [ ] **Step 3: Create the OG image**

Create `apps/web/app/use-cases/[slug]/opengraph-image.tsx` following the pattern in `apps/web/app/opengraph-image.tsx`. Use `ImageResponse` with the page title and description from `useCasePages[slug]`.

- [ ] **Step 4: Verify build and type-check**

Run: `cd apps/web && pnpm type-check && pnpm build 2>&1 | tail -20`
Expected: No errors, all 6 use-case pages generated

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/use-cases/
git commit -m "feat(seo): add 6 use-case landing pages with OG images"
```

---

## Task 8: Feature Landing Pages (3 pages)

**Files:**
- Create: `apps/web/app/features/data.ts`
- Create: `apps/web/app/features/[slug]/page.tsx`
- Create: `apps/web/app/features/[slug]/opengraph-image.tsx`

- [ ] **Step 1: Create data file**

Create `apps/web/app/features/data.ts` with 3 entries: `semantic-search`, `ai-tagging`, `knowledge-qa`. Each entry follows the same shape as use-case data but includes a `docsLink` field pointing to the corresponding `/docs/features/*` page (e.g., `/docs/features/search`).

- [ ] **Step 2: Create page and OG image**

Same pattern as Task 7 but for `/features/[slug]`. The page component adds a "Learn more in the docs" link using the `docsLink` field.

- [ ] **Step 3: Verify build**

Run: `cd apps/web && pnpm type-check && pnpm build 2>&1 | tail -20`
Expected: No errors, 3 feature pages generated

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/features/
git commit -m "feat(seo): add 3 feature landing pages (semantic search, AI tagging, knowledge QA)"
```

---

## Task 9: Comparison Landing Pages (3 pages)

**Files:**
- Create: `apps/web/app/compare/data.ts`
- Create: `apps/web/app/compare/[slug]/page.tsx`
- Create: `apps/web/app/compare/[slug]/opengraph-image.tsx`

- [ ] **Step 1: Create data file**

Create `apps/web/app/compare/data.ts` with 3 entries: `notion`, `obsidian`, `evernote`. Each entry includes the same landing page data shape plus a `comparison` field with `competitor` name and `features` array for the `ComparisonTable`. All comparison claims must be factually accurate.

- [ ] **Step 2: Create page and OG image**

Same pattern as Tasks 7-8 but renders `ComparisonTable` between the solution and social proof sections.

- [ ] **Step 3: Verify build**

Run: `cd apps/web && pnpm type-check && pnpm build 2>&1 | tail -20`
Expected: No errors, 3 comparison pages generated

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/compare/
git commit -m "feat(seo): add 3 comparison pages (vs Notion, Obsidian, Evernote)"
```

---

## Task 10: Blog Index Page

**Files:**
- Create: `apps/web/app/blog/page.tsx`

- [ ] **Step 1: Create the blog page**

Create `apps/web/app/blog/page.tsx` as a static server component with:
- `generateMetadata` using `generateSeoMetadata` with title "Blog" and path "/blog"
- Hardcoded array of blog posts: `{ title, date, summary, url }` — start with the existing Substack post: "I Built an AI-Powered Second Brain"
- Each post rendered as a card linking to the Substack URL with `target="_blank"` and `rel="noopener noreferrer"`
- Style matching the docs/support page pattern (container, heading, card layout)

- [ ] **Step 2: Verify build**

Run: `cd apps/web && pnpm build 2>&1 | tail -10`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/blog/
git commit -m "feat(seo): add blog index page linking to Substack posts"
```

---

## Task 11: TIL RSS Feed

**Files:**
- Create: `apps/web/app/til/feed/route.ts`

- [ ] **Step 1: Create the RSS route handler**

Create `apps/web/app/til/feed/route.ts`:

```typescript
import { db } from '@/lib/db/client';
import { tilPosts, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const revalidate = 3600;

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.mindweave.space';

export async function GET() {
  const posts = await db
    .select({
      id: tilPosts.id,
      title: tilPosts.title,
      body: tilPosts.body,
      publishedAt: tilPosts.publishedAt,
      userId: tilPosts.userId,
    })
    .from(tilPosts)
    .orderBy(desc(tilPosts.publishedAt))
    .limit(50);

  const items = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/til/${post.id}</link>
      <guid isPermaLink="true">${baseUrl}/til/${post.id}</guid>
      <description><![CDATA[${(post.body ?? '').slice(0, 300)}]]></description>
      <pubDate>${post.publishedAt ? new Date(post.publishedAt).toUTCString() : ''}</pubDate>
    </item>`
    )
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Mindweave TIL Feed</title>
    <link>${baseUrl}/til</link>
    <description>Today I Learned posts from the Mindweave community</description>
    <language>en-us</language>
    <atom:link href="${baseUrl}/til/feed" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
```

- [ ] **Step 2: Verify type-check**

Run: `cd apps/web && pnpm type-check`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/til/feed/
git commit -m "feat(seo): add TIL RSS feed at /til/feed"
```

---

## Task 12: Add JSON-LD to Existing Public Pages

**Files:**
- Modify: `apps/web/app/til/[tilId]/page.tsx` — add `Article` JSON-LD
- Modify: `apps/web/app/marketplace/[listingId]/page.tsx` — add `Product` JSON-LD
- Modify: `apps/web/app/profile/[username]/page.tsx` — add `Person` JSON-LD
- Modify: `apps/web/app/docs/faq/page.tsx` — add `FAQPage` JSON-LD
- Modify: `apps/web/app/docs/layout.tsx` — add `BreadcrumbList` JSON-LD

- [ ] **Step 1: Add Article JSON-LD to TIL post page**

In `apps/web/app/til/[tilId]/page.tsx`, import `JsonLd` from `@/components/seo/JsonLd` and add after the metadata query:

```typescript
const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: post.title,
  datePublished: post.publishedAt,
  author: { '@type': 'Person', name: post.author?.name ?? 'Mindweave User' },
  publisher: { '@type': 'Organization', name: 'Mindweave' },
  url: `https://www.mindweave.space/til/${tilId}`,
};
```

Render `<JsonLd data={articleJsonLd} />` in the component JSX.

- [ ] **Step 2: Add Product JSON-LD to marketplace listing**

In `apps/web/app/marketplace/[listingId]/page.tsx`, add:

```typescript
const productJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: listing.collection.name,
  description: listing.description,
  url: `https://www.mindweave.space/marketplace/${listingId}`,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};
```

- [ ] **Step 3: Add Person JSON-LD to public profile**

In `apps/web/app/profile/[username]/page.tsx`, add:

```typescript
const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.name ?? profile.username,
  url: `https://www.mindweave.space/profile/${profile.username}`,
  description: profile.bio ?? undefined,
};
```

- [ ] **Step 4: Add FAQPage JSON-LD to docs/faq**

In `apps/web/app/docs/faq/page.tsx`, add a `FAQPage` schema with all existing FAQ entries converted to `Question`/`Answer` pairs.

- [ ] **Step 5: Add BreadcrumbList to docs layout**

In `apps/web/app/docs/layout.tsx`, add a `BreadcrumbList` JSON-LD based on the current docs path.

- [ ] **Step 6: Verify type-check and lint**

Run: `cd apps/web && pnpm type-check && pnpm lint`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/til/[tilId]/page.tsx apps/web/app/marketplace/[listingId]/page.tsx apps/web/app/profile/[username]/page.tsx apps/web/app/docs/faq/page.tsx apps/web/app/docs/layout.tsx
git commit -m "feat(seo): add JSON-LD structured data to TIL, marketplace, profile, docs pages"
```

---

## Task 13: Add Footer Links to Landing Page

**Files:**
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Add links to the footer**

In `apps/web/app/page.tsx`, locate the footer section (~line 886). Add a new row of links for the landing pages:

```
Use Cases: AI Note Taking · Second Brain · Researchers · Developers · Students
Compare: vs Notion · vs Obsidian · vs Evernote
```

Use the existing footer link style (`text-muted-foreground hover:text-foreground`).

- [ ] **Step 2: Verify build**

Run: `cd apps/web && pnpm build 2>&1 | tail -10`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat(seo): add use-case and comparison links to landing page footer"
```

---

## Task 14: Add RSS Link to TIL Page & Homepage JSON-LD Enhancement

**Files:**
- Modify: `apps/web/app/til/page.tsx` — add `<link rel="alternate">` for RSS feed
- Modify: `apps/web/app/page.tsx` — homepage JSON-LD already has `@graph` with `WebSite` + `WebApplication`, no changes needed (verified existing code at lines 281-326 already contains both schemas)

- [ ] **Step 1: Add RSS alternate link to TIL page metadata**

In `apps/web/app/til/page.tsx`, add to the `generateMetadata` or static `metadata` export:

```typescript
alternates: {
  types: {
    'application/rss+xml': 'https://www.mindweave.space/til/feed',
  },
},
```

This tells browsers and crawlers that an RSS feed exists for this page.

- [ ] **Step 2: Verify build**

Run: `cd apps/web && pnpm type-check`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/til/page.tsx
git commit -m "feat(seo): add RSS alternate link to TIL feed page"
```

---

## Task 15: Run All Quality Gates

- [ ] **Step 1: Run tests**

Run: `cd apps/web && pnpm test -- --run`
Expected: All tests pass (2,675+ existing + new tests)

- [ ] **Step 2: Run type-check**

Run: `pnpm type-check`
Expected: No TypeScript errors

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: No ESLint errors or warnings

- [ ] **Step 4: Run build**

Run: `pnpm build`
Expected: Production build succeeds, all static pages generated

- [ ] **Step 5: Verify new pages in build output**

Check the build output for:
- `/use-cases/ai-note-taking`, `/use-cases/second-brain`, etc. (6 pages)
- `/features/semantic-search`, `/features/ai-tagging`, `/features/knowledge-qa` (3 pages)
- `/compare/notion`, `/compare/obsidian`, `/compare/evernote` (3 pages)
- `/blog` (1 page)
- `/til/feed` (RSS route)
- `/sitemap.xml` (includes all new URLs)

---

## Summary

| Task | What | Files | Tests |
|------|------|-------|-------|
| 1 | Metadata helper | `lib/seo/metadata.ts` | 4 tests |
| 2 | JsonLd component | `components/seo/JsonLd.tsx` | 3 tests |
| 3 | robots.txt update | `app/robots.ts` | — |
| 4 | Async sitemap | `app/sitemap.ts` | — |
| 5 | LandingPageTemplate | `components/seo/LandingPageTemplate.tsx` | 5 tests |
| 6 | ComparisonTable | `components/seo/ComparisonTable.tsx` | 3 tests |
| 7 | Use-case pages (6) | `app/use-cases/` | — |
| 8 | Feature pages (3) | `app/features/` | — |
| 9 | Comparison pages (3) | `app/compare/` | — |
| 10 | Blog index | `app/blog/page.tsx` | — |
| 11 | TIL RSS feed | `app/til/feed/route.ts` | — |
| 12 | JSON-LD on existing pages | 5 modified files | — |
| 13 | Footer links | `app/page.tsx` | — |
| 14 | RSS link + homepage JSON-LD | `app/til/page.tsx` | — |
| 15 | Quality gates | — | Full suite |
