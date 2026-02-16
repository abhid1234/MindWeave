---
name: seo-audit
description: Perform SEO audits on web pages and suggest improvements. Use this skill when reviewing pages for search engine optimization, improving metadata, fixing accessibility issues, or optimizing content for discoverability. Triggers on tasks involving SEO, metadata, page titles, descriptions, or search rankings.
disable-model-invocation: true
---

# SEO Audit

Perform a comprehensive SEO audit and provide actionable recommendations.

## Audit Checklist

### 1. Technical SEO
- **Page title**: Present, unique, 50-60 characters, includes primary keyword
- **Meta description**: Present, unique, 150-160 characters, compelling with CTA
- **Canonical URL**: Set correctly to avoid duplicate content
- **robots.txt**: Not blocking important pages
- **Sitemap**: XML sitemap exists and includes all important pages
- **HTTPS**: All pages served over HTTPS, no mixed content
- **Mobile-friendly**: Responsive design, viewport meta tag set
- **Page speed**: Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)

### 2. On-Page SEO
- **Headings**: Single H1 per page, logical H2-H6 hierarchy
- **URL structure**: Clean, descriptive, lowercase, hyphens (not underscores)
- **Internal links**: Relevant cross-linking between related pages
- **Image alt text**: Descriptive alt attributes on all images
- **Content length**: Sufficient content for the topic (300+ words for landing pages)
- **Keyword usage**: Primary keyword in title, H1, first paragraph, and naturally throughout
- **Structured data**: JSON-LD schema markup (Organization, WebSite, BreadcrumbList)

### 3. Next.js Specific
- **Metadata API**: Using `generateMetadata()` or `metadata` export in layout/page files
- **Open Graph tags**: `og:title`, `og:description`, `og:image`, `og:url`
- **Twitter cards**: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- **Dynamic metadata**: Unique metadata per page, not duplicated across routes
- **Static generation**: Pages that can be static should use SSG, not SSR
- **Image optimization**: Using `next/image` with proper `width`, `height`, and `alt`
- **Font optimization**: Using `next/font` for zero layout shift

### 4. Accessibility (SEO Impact)
- **Semantic HTML**: Using `<nav>`, `<main>`, `<article>`, `<section>` correctly
- **ARIA labels**: Interactive elements have accessible names
- **Color contrast**: Text meets WCAG AA (4.5:1 for normal, 3:1 for large)
- **Keyboard navigation**: All interactive elements focusable and operable
- **Skip navigation**: Skip-to-content link for keyboard users
- **Lang attribute**: `<html lang="en">` set correctly

### 5. Content & Social
- **Social sharing preview**: OG image (1200x630), title, description render correctly
- **Favicon**: Multiple sizes (16x16, 32x32, apple-touch-icon)
- **404 page**: Custom, helpful, with navigation back to main content
- **Loading states**: No layout shift during content loading

## How to Audit

When asked to audit a page:

1. Read the page's source files (layout.tsx, page.tsx, metadata)
2. Check for each item in the checklist above
3. Score each category (Good / Needs Improvement / Missing)
4. Provide specific code fixes for each issue found
5. Prioritize fixes by impact: Technical > On-Page > Accessibility > Social

## Output Format

```
## SEO Audit: [Page Name]

### Score: X/10

### Critical Issues
- [ ] Issue description → Fix

### Improvements
- [ ] Issue description → Fix

### Passing
- [x] What's already good
```
