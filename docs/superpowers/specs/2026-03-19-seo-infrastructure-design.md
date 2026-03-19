# SEO Infrastructure & Keyword Landing Pages

## Goal

Establish Mindweave's organic search presence from near-zero. Build SEO plumbing for all public pages and create 12 keyword-targeted landing pages for immediate searchability.

## Context

Mindweave is a production-ready AI knowledge hub at mindweave.space with 32+ features, but near-zero organic traffic. Most visits come from direct links, Product Hunt, or GitHub. Public content (TIL posts, marketplace listings, public graphs) exists as features but has minimal actual user-generated content yet.

## Strategy

Hybrid approach: SEO infrastructure first (sitemaps, structured data, meta tags) so every public page is crawlable, plus 12 static landing pages targeting high-intent keywords for immediate search visibility. As user-generated public content grows, the infrastructure indexes it automatically.

---

## Implementation Order

1. **Step 1: SEO infrastructure** — sitemap, robots.txt, `JsonLd.tsx`, `metadata.ts` helpers
2. **Step 2: Shared components** — `LandingPageTemplate.tsx`, `ComparisonTable.tsx`
3. **Step 3: Landing pages** — 12 keyword pages using shared components
4. **Step 4: Content discoverability** — JSON-LD on existing public pages, RSS feed, blog index, internal linking

Each step is independently deployable. Steps 1-2 are dependencies for Step 3.

---

## Section 1: SEO Infrastructure

### Dynamic Sitemap (`/sitemap.ts`)

Migrate existing synchronous sitemap to async using `generateSitemaps()` for separation:
- **Static sitemap**: landing page, docs, privacy, terms, support, blog, use-case/feature/compare pages
- **Dynamic sitemap**: TIL posts, marketplace listings, public graphs, shared content, public profiles (queries database via Drizzle)

Dynamic sitemap uses `export const revalidate = 3600` (ISR, regenerate hourly) to avoid DB hits on every crawler request. Error handling: if DB is unreachable, return empty array for dynamic entries (static sitemap still works).

Includes `lastmod` attribute. Omit `changefreq` and `priority` (ignored by Google, included only for non-Google crawlers if desired).

### robots.ts

- Allow all crawlers on public pages
- Block: `/dashboard/*`, `/api/*`, `/onboarding`, `/.well-known/`
- Allow: `/embed/*`, `/share/*` (these are meant to be publicly discoverable)
- Reference sitemap URL

### Meta Tags & Structured Data

Dynamic `<title>` and `<meta description>` for every public page. JSON-LD structured data:

| Page Type | Schema |
|-----------|--------|
| Homepage | `WebApplication` added alongside existing `WebSite` schema in a `@graph` array |
| TIL posts | `Article` |
| Marketplace listings | `Product` |
| Docs FAQ | `FAQPage` |
| All docs | `BreadcrumbList` |
| Public profiles | `Person` |
| Use-case/feature/compare pages | `WebPage` with `about` |

Canonical URLs on all pages to prevent duplicate content.

### Open Graph & Twitter Cards

Extend existing OG support to all public pages:
- **TIL posts & marketplace**: Dynamic OG images via `opengraph-image.tsx` per route segment
- **Landing pages (use-cases, features, compare)**: Each gets its own `opengraph-image.tsx` with keyword-specific title (not the generic "AI-Powered Personal Knowledge Hub")
- **Docs, profiles**: Static page-specific OG metadata

### Performance SEO

- Verify Core Web Vitals (LCP, CLS, FID)
- Add `<link rel="preconnect">` for external domains

---

## Section 2: Keyword Landing Pages

12 static pages targeting high-intent search queries.

### Route Conflict Resolution

The existing `/docs/features/*` pages (search, tagging, ask) are documentation-style reference pages. The new `/features/*` pages are marketing-oriented landing pages with different content and intent. To prevent SEO cannibalization:
- `/features/*` pages are marketing pages (problem/solution narrative, CTAs, social proof)
- `/docs/features/*` pages remain as technical reference docs
- Each `/features/*` page adds `rel="canonical"` pointing to itself
- Content is differentiated: marketing pages focus on "why", docs focus on "how"
- `/features/*` pages link to corresponding `/docs/features/*` pages as "Learn more in the docs"

### URL Structure

| Page | Target Keyword | URL |
|------|---------------|-----|
| AI Note Taking | "ai note taking app" | `/use-cases/ai-note-taking` |
| Second Brain | "second brain app" | `/use-cases/second-brain` |
| For Researchers | "research note organizer" | `/use-cases/researchers` |
| For Developers | "developer knowledge base" | `/use-cases/developers` |
| For Students | "ai study tool" | `/use-cases/students` |
| Semantic Search | "semantic search notes" | `/features/semantic-search` |
| AI Tagging | "auto tag notes ai" | `/features/ai-tagging` |
| Knowledge Q&A | "ask questions about notes" | `/features/knowledge-qa` |
| vs Notion | "notion alternative open source" | `/compare/notion` |
| vs Obsidian | "obsidian alternative ai" | `/compare/obsidian` |
| vs Evernote | "evernote alternative 2026" | `/compare/evernote` |
| Open Source | "open source knowledge management" | `/use-cases/open-source` |

### Architecture: Dynamic `[slug]` with `generateStaticParams`

Instead of 12 individual `page.tsx` files, use a data-driven approach:

```
use-cases/[slug]/page.tsx     + generateStaticParams() → 6 pages
features/[slug]/page.tsx      + generateStaticParams() → 3 pages
compare/[slug]/page.tsx       + generateStaticParams() → 3 pages
```

Each route has one `page.tsx` using `LandingPageTemplate` + a data file (`data.ts`) exporting the content objects for each slug. This reduces duplication from 12 near-identical files to 3 templates + 3 data files.

### Page Template Structure

1. **Hero** — keyword-rich H1, 1-2 sentence value prop, CTA button
2. **Problem** — "The problem with [current approach]" (2-3 paragraphs)
3. **Solution** — How Mindweave solves it with feature highlights
4. **Feature grid** — 3-4 relevant features with icons (reuse existing components)
5. **Comparison table** — (for `/compare/*` pages) Mindweave vs competitor feature matrix
6. **Social proof** — GitHub stars, test count, open source badge
7. **CTA** — "Start free" button

All pages are fully static — no database queries, no API calls. Content is hardcoded in data files.

**Comparison page content note:** All competitor comparisons must be factually accurate and based on publicly available feature lists. Avoid subjective claims. Use checkmarks/X marks for feature presence, not quality judgments.

### Internal Linking

- Main landing page (`/`) footer adds links to `/use-cases/*` and `/compare/*` sections
- Each landing page cross-links to related pages (e.g., "For Researchers" links to "Semantic Search" and "vs Notion")
- Each `/features/*` page links to its `/docs/features/*` counterpart
- Each landing page links back to `/` and to `/login` (CTA)

---

## Section 3: Content Discoverability Enhancements

### TIL Feed

- JSON-LD `Article` schema on each `/til/[tilId]` page
- Internal linking from TIL posts to related docs pages
- RSS feed at `/til/feed/route.ts` (serves at `/til/feed` with `Content-Type: application/rss+xml`). Linked from `<link rel="alternate" type="application/rss+xml">` in the TIL feed page head and referenced in sitemap.

### Marketplace

- JSON-LD `Product` schema on each `/marketplace/[listingId]`
- Indexable category filtered views with canonical URLs
- "Trending" and "Newest" get distinct canonical URLs

### Docs

- `FAQPage` schema on `/docs/faq`
- `BreadcrumbList` schema on all docs pages
- "Related docs" section at bottom of each doc page

### Public Profiles

- `Person` JSON-LD on `/profile/[username]`
- Indexable creator pages linking to public content

### Blog

- `/blog/page.tsx` — static index page with hardcoded list of blog posts (title, date, summary, Substack URL)
- Updated manually when new posts are published (no ISR/RSS fetch — keeps it simple, no external dependency at build time)
- Links to Substack posts open in new tab
- Page has its own meta tags optimized for "mindweave blog" / "ai knowledge management blog"

---

## Section 4: Technical Implementation

### File Structure

```
apps/web/app/
├── sitemap.ts                          # generateSitemaps() with static + dynamic
├── robots.ts
├── use-cases/
│   ├── [slug]/
│   │   ├── page.tsx                    # Uses LandingPageTemplate
│   │   └── opengraph-image.tsx
│   └── data.ts                         # Content for all 6 use-case pages
├── features/
│   ├── [slug]/
│   │   ├── page.tsx
│   │   └── opengraph-image.tsx
│   └── data.ts                         # Content for all 3 feature pages
├── compare/
│   ├── [slug]/
│   │   ├── page.tsx
│   │   └── opengraph-image.tsx
│   └── data.ts                         # Content for all 3 comparison pages
├── blog/page.tsx                       # Static blog index
└── til/
    └── feed/route.ts                   # RSS feed handler
```

### Shared Components

- `components/seo/JsonLd.tsx` — Reusable JSON-LD renderer accepting schema type + data props. Renders `<script type="application/ld+json">` in head.
- `components/seo/LandingPageTemplate.tsx` — Template for use-case and feature pages (hero, problem, solution, features grid, CTA). Accepts a typed data object.
- `components/seo/ComparisonTable.tsx` — Reusable feature comparison matrix with check/x icons.
- `lib/seo/metadata.ts` — Helper to generate consistent `Metadata` objects (title, description, openGraph, twitter, canonical).

### Data Approach

- Landing pages are fully static — no database queries
- Content defined in `data.ts` files per route group
- `generateStaticParams()` returns slugs from data files
- `generateMetadata()` pulls from same data files
- Sitemap queries database for dynamic content via Drizzle (async, with ISR caching)

### Testing

- Unit tests for `JsonLd.tsx` output (valid JSON-LD structure per schema type)
- Unit tests for `metadata.ts` helper output
- Unit tests for sitemap generation (static entries + mocked dynamic entries)
- Unit tests for robots.txt output
- Snapshot tests for `LandingPageTemplate` and `ComparisonTable` components
- Render tests for each landing page slug (loads without errors, has expected H1, meta tags)
- Validate JSON-LD output against Google's schema requirements

### No Changes To

- Auth, database schema, or server actions
- Dashboard or protected routes
- Existing landing page at `/` (except adding footer links to new pages)
- Existing `/docs/features/*` pages (no redirects, no content changes)

---

## Success Criteria

1. `sitemap.xml` and `robots.txt` serve correctly and are discoverable by crawlers
2. All 12 landing pages render with valid HTML, meta tags, and JSON-LD
3. Google Search Console shows pages being indexed within 2 weeks of deployment
4. All public pages (TIL, marketplace, docs, profiles) have structured data
5. Core Web Vitals pass on all new pages
6. RSS feed validates and is discoverable via `<link>` tag
7. No SEO cannibalization between `/features/*` and `/docs/features/*` (differentiated content, self-referencing canonicals)
8. Landing pages cross-link to each other and to docs
