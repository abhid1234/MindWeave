# Product-Led Growth Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build viral loops and conversion mechanics into Mindweave so every public page converts visitors and every user action drives organic growth.

**Architecture:** 6 workstreams executed in priority order. Each workstream adds a layer to the growth flywheel: CREATE → SHARE → CONVERT → repeat. Built on existing Next.js 15 App Router patterns with Drizzle ORM, Resend email, and the existing badge system.

**Tech Stack:** Next.js 15, TypeScript, Drizzle ORM, PostgreSQL, Resend (email), next/og (OG images), Tailwind CSS + shadcn/ui, Vitest + React Testing Library

**Spec:** `docs/superpowers/specs/2026-03-21-product-led-growth-engine-design.md`

---

## File Structure

### New Files

```
apps/web/
├── components/
│   ├── growth/
│   │   ├── SignupBanner.tsx              # Sticky bottom signup banner for public pages
│   │   ├── SignupBanner.test.tsx
│   │   ├── ContextualCTA.tsx             # Page-specific CTA component
│   │   ├── ContextualCTA.test.tsx
│   │   ├── SocialProofCounters.tsx       # Live stats counters
│   │   ├── SocialProofCounters.test.tsx
│   │   ├── ShareButton.tsx               # Universal share dropdown
│   │   ├── ShareButton.test.tsx
│   │   ├── SharePreview.tsx              # OG card preview before sharing
│   │   ├── SharePreview.test.tsx
│   │   ├── ShareNudge.tsx                # Post-action share modal
│   │   ├── ShareNudge.test.tsx
│   │   ├── MilestoneShare.tsx            # Milestone achievement share prompt
│   │   └── MilestoneShare.test.tsx
│   └── referral/
│       ├── ReferralDashboard.tsx          # Referral stats + invite UI
│       ├── ReferralDashboard.test.tsx
│       ├── InviteForm.tsx                # Email invite form
│       └── InviteForm.test.tsx
├── app/
│   ├── r/[username]/route.ts             # Referral redirect handler
│   ├── api/
│   │   ├── analytics/event/route.ts      # Client-side event beacon endpoint
│   │   └── og/til/route.tsx              # Dynamic OG images for TIL posts
│   ├── til/
│   │   ├── topic/[tag]/page.tsx          # TIL topic aggregation pages
│   │   ├── trending/page.tsx             # Trending TILs page
│   │   └── weekly/page.tsx               # Weekly TIL digest page
│   ├── dashboard/
│   │   ├── settings/referrals/page.tsx   # Referral dashboard page
│   │   └── admin/analytics/page.tsx      # Admin analytics dashboard
│   └── actions/
│       ├── analytics.ts                  # Analytics tracking actions
│       ├── analytics.test.ts
│       ├── referrals.ts                  # Referral system actions
│       ├── referrals.test.ts
│       ├── social-proof.ts               # Social proof stats action
│       └── social-proof.test.ts
├── lib/
│   ├── analytics/
│   │   ├── tracker.ts                    # Client-side trackEvent() function
│   │   └── tracker.test.ts
│   └── email/
│       ├── templates/
│       │   ├── traction.ts               # Traction notification email templates
│       │   ├── creator-digest.ts         # Weekly creator digest template
│       │   ├── activation.ts             # New user drip email templates
│       │   └── invite.ts                 # Referral invite email template
│       └── triggers.ts                   # Event-triggered email logic
```

### Modified Files

```
apps/web/lib/db/schema.ts                # Add referrals + analytics_events tables
apps/web/lib/badges/definitions.ts        # Add Referrer badge category (3 badges)
apps/web/lib/badges/engine.ts             # Add referrer checker
apps/web/app/sitemap.ts                   # Add topic pages, trending, weekly
apps/web/app/page.tsx                     # Homepage hero optimization
apps/web/app/til/[tilId]/page.tsx         # Add JSON-LD Article, internal links, OG image
apps/web/app/til/page.tsx                 # Add ContextualCTA
apps/web/app/marketplace/[listingId]/page.tsx  # Add ContextualCTA, internal links
apps/web/app/share/[shareId]/page.tsx     # Add ContextualCTA
apps/web/app/profile/[username]/page.tsx  # Add ContextualCTA, internal links
apps/web/middleware.ts                    # Add analytics session cookie
apps/web/app/actions/til.ts              # Add share nudge trigger, review-to-TIL
apps/web/app/actions/badges.ts           # Add referral badge trigger
apps/web/lib/email.ts                    # Add traction + activation email sends
```

---

## Task 1: Analytics Events Schema & Server Action

**Files:**
- Modify: `apps/web/lib/db/schema.ts`
- Create: `apps/web/app/actions/analytics.ts`
- Create: `apps/web/app/actions/analytics.test.ts`

This is the foundation — analytics must exist before other workstreams can track conversions.

- [ ] **Step 1: Add analytics_events table to schema**

In `apps/web/lib/db/schema.ts`, add after the last table definition:

```typescript
export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: text('session_id').notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    event: text('event').notNull(),
    page: text('page').notNull(),
    referrer: text('referrer'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_analytics_events_created').on(table.createdAt),
    index('idx_analytics_events_event').on(table.event),
    index('idx_analytics_events_session').on(table.sessionId),
  ]
);
```

- [ ] **Step 2: Generate migration**

Run: `cd apps/web && pnpm db:generate`
Expected: New SQL migration file created in `drizzle/`

- [ ] **Step 3: Push schema to local DB**

Run: `cd apps/web && pnpm db:push`
Expected: Schema applied successfully

- [ ] **Step 4: Write failing test for trackAnalyticsEvent action**

Create `apps/web/app/actions/analytics.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDbInsert } = vi.hoisted(() => ({
  mockDbInsert: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    insert: () => ({
      values: mockDbInsert,
    }),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  analyticsEvents: { id: 'id' },
}));

import { trackAnalyticsEvent } from './analytics';

describe('Analytics Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should track a page_view event', async () => {
    const result = await trackAnalyticsEvent({
      sessionId: 'session-123',
      event: 'page_view',
      page: '/til',
    });
    expect(result.success).toBe(true);
    expect(mockDbInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-123',
        event: 'page_view',
        page: '/til',
      })
    );
  });

  it('should track event with UTM params', async () => {
    const result = await trackAnalyticsEvent({
      sessionId: 'session-123',
      event: 'page_view',
      page: '/til',
      utmSource: 'reddit',
      utmMedium: 'post',
      utmCampaign: 'launch',
    });
    expect(result.success).toBe(true);
    expect(mockDbInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        utmSource: 'reddit',
        utmMedium: 'post',
        utmCampaign: 'launch',
      })
    );
  });

  it('should reject empty event', async () => {
    const result = await trackAnalyticsEvent({
      sessionId: 'session-123',
      event: '',
      page: '/til',
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd apps/web && pnpm test -- --run app/actions/analytics.test.ts`
Expected: FAIL — module not found

- [ ] **Step 6: Implement trackAnalyticsEvent action**

Create `apps/web/app/actions/analytics.ts`:

```typescript
'use server';

import { db } from '@/lib/db/client';
import { analyticsEvents } from '@/lib/db/schema';

interface TrackEventParams {
  sessionId: string;
  event: string;
  page: string;
  userId?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  metadata?: Record<string, unknown>;
}

export async function trackAnalyticsEvent(
  params: TrackEventParams
): Promise<{ success: boolean; message?: string }> {
  try {
    if (!params.sessionId || !params.event || !params.page) {
      return { success: false, message: 'Missing required fields.' };
    }

    await db.insert(analyticsEvents).values({
      sessionId: params.sessionId,
      userId: params.userId,
      event: params.event,
      page: params.page,
      referrer: params.referrer,
      utmSource: params.utmSource,
      utmMedium: params.utmMedium,
      utmCampaign: params.utmCampaign,
      metadata: params.metadata,
    });

    return { success: true };
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return { success: false, message: 'Failed to track event.' };
  }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd apps/web && pnpm test -- --run app/actions/analytics.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 8: Commit**

```bash
git add apps/web/lib/db/schema.ts apps/web/app/actions/analytics.ts apps/web/app/actions/analytics.test.ts apps/web/drizzle/
git commit -m "feat(growth): add analytics_events schema and trackAnalyticsEvent action"
```

---

## Task 2: Client-Side Analytics Tracker & Event Beacon API

**Files:**
- Create: `apps/web/lib/analytics/tracker.ts`
- Create: `apps/web/lib/analytics/tracker.test.ts`
- Create: `apps/web/app/api/analytics/event/route.ts`

- [ ] **Step 1: Write failing test for client-side tracker**

Create `apps/web/lib/analytics/tracker.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Analytics Tracker', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      sendBeacon: vi.fn().mockReturnValue(true),
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'mw_session=session-abc123',
    });
  });

  it('should send event via sendBeacon', async () => {
    const { trackEvent } = await import('./tracker');
    trackEvent('share_click', { platform: 'twitter' });
    expect(navigator.sendBeacon).toHaveBeenCalledWith(
      '/api/analytics/event',
      expect.any(String)
    );
  });

  it('should include session ID from cookie', async () => {
    const { trackEvent } = await import('./tracker');
    trackEvent('cta_click', { variant: 'til' });
    const sentData = JSON.parse(
      (navigator.sendBeacon as ReturnType<typeof vi.fn>).mock.calls[0][1]
    );
    expect(sentData.sessionId).toBe('session-abc123');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test -- --run lib/analytics/tracker.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement client-side tracker**

Create `apps/web/lib/analytics/tracker.ts`:

```typescript
function getSessionId(): string {
  const match = document.cookie.match(/mw_session=([^;]+)/);
  return match?.[1] || 'anonymous';
}

function getUtmParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
    const val = params.get(key);
    if (val) utm[key.replace('utm_', '')] = val;
  }
  return utm;
}

export function trackEvent(
  event: string,
  metadata?: Record<string, unknown>
): void {
  const utm = getUtmParams();
  const payload = JSON.stringify({
    sessionId: getSessionId(),
    event,
    page: window.location.pathname,
    referrer: document.referrer || undefined,
    utmSource: utm.source,
    utmMedium: utm.medium,
    utmCampaign: utm.campaign,
    metadata,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/event', payload);
  } else {
    fetch('/api/analytics/event', {
      method: 'POST',
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }
}
```

- [ ] **Step 4: Implement event beacon API route**

Create `apps/web/app/api/analytics/event/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { trackAnalyticsEvent } from '@/app/actions/analytics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await trackAnalyticsEvent(body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
```

- [ ] **Step 5: Run tests**

Run: `cd apps/web && pnpm test -- --run lib/analytics/tracker.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/lib/analytics/ apps/web/app/api/analytics/
git commit -m "feat(growth): add client-side analytics tracker and event beacon API"
```

---

## Task 3: Analytics Session Cookie Middleware

**Files:**
- Modify: `apps/web/middleware.ts`

- [ ] **Step 1: Read current middleware**

Read `apps/web/middleware.ts` to understand the current auth-only middleware pattern.

- [ ] **Step 2: Add session cookie logic to middleware**

Modify `apps/web/middleware.ts` to set an `mw_session` cookie on every request if not present. The cookie is an anonymous UUID for analytics tracking.

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import authConfig from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Set analytics session cookie if not present
  if (!request.cookies.get('mw_session')) {
    const sessionId = crypto.randomUUID();
    response.cookies.set('mw_session', sessionId, {
      httpOnly: false, // Needs client-side access for tracker
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
  }

  return response;
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
```

**Note:** Read the actual middleware first — it may use `export const { auth: middleware }` shorthand. Adapt the session cookie injection to the existing pattern. If the current pattern doesn't allow response modification, wrap it.

- [ ] **Step 3: Test locally**

Run: `cd apps/web && pnpm dev`
Visit any page, check browser cookies for `mw_session`.
Expected: Cookie present with UUID value.

- [ ] **Step 4: Commit**

```bash
git add apps/web/middleware.ts
git commit -m "feat(growth): add analytics session cookie to middleware"
```

---

## Task 4: Social Proof Stats Action

**Files:**
- Create: `apps/web/app/actions/social-proof.ts`
- Create: `apps/web/app/actions/social-proof.test.ts`

- [ ] **Step 1: Write failing test**

Create `apps/web/app/actions/social-proof.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDbSelect } = vi.hoisted(() => ({
  mockDbSelect: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    select: () => ({
      from: () => ({
        then: (resolve: Function) => resolve([{ value: 42 }]),
      }),
    }),
    execute: mockDbSelect,
  },
}));

vi.mock('@/lib/db/schema', () => ({
  content: {},
  tilPosts: {},
  collections: {},
  users: {},
}));

import { getSocialProofStats } from './social-proof';

describe('Social Proof Stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbSelect.mockResolvedValue([
      { til_count: 150, collection_count: 45, note_count: 1200, user_count: 89 },
    ]);
  });

  it('should return stats object with all counts', async () => {
    const result = await getSocialProofStats();
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('tilCount');
    expect(result.data).toHaveProperty('collectionCount');
    expect(result.data).toHaveProperty('noteCount');
    expect(result.data).toHaveProperty('userCount');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test -- --run app/actions/social-proof.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement getSocialProofStats**

Create `apps/web/app/actions/social-proof.ts`:

```typescript
'use server';

import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';

interface SocialProofStats {
  tilCount: number;
  collectionCount: number;
  noteCount: number;
  userCount: number;
}

let cachedStats: SocialProofStats | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function getSocialProofStats(): Promise<{
  success: boolean;
  data?: SocialProofStats;
  message?: string;
}> {
  try {
    if (cachedStats && Date.now() - cacheTimestamp < CACHE_TTL) {
      return { success: true, data: cachedStats };
    }

    const result = await db.execute<{
      til_count: number;
      collection_count: number;
      note_count: number;
      user_count: number;
    }>(sql`
      SELECT
        (SELECT COUNT(*) FROM til_posts)::int as til_count,
        (SELECT COUNT(*) FROM collections)::int as collection_count,
        (SELECT COUNT(*) FROM content)::int as note_count,
        (SELECT COUNT(*) FROM users)::int as user_count
    `);

    const row = result[0] ?? { til_count: 0, collection_count: 0, note_count: 0, user_count: 0 };
    cachedStats = {
      tilCount: row.til_count,
      collectionCount: row.collection_count,
      noteCount: row.note_count,
      userCount: row.user_count,
    };
    cacheTimestamp = Date.now();

    return { success: true, data: cachedStats };
  } catch (error) {
    console.error('Error fetching social proof stats:', error);
    return { success: false, message: 'Failed to fetch stats.' };
  }
}
```

- [ ] **Step 4: Run test**

Run: `cd apps/web && pnpm test -- --run app/actions/social-proof.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/actions/social-proof.ts apps/web/app/actions/social-proof.test.ts
git commit -m "feat(growth): add social proof stats action with in-memory cache"
```

---

## Task 5: SignupBanner Component

**Files:**
- Create: `apps/web/components/growth/SignupBanner.tsx`
- Create: `apps/web/components/growth/SignupBanner.test.tsx`

- [ ] **Step 1: Write failing test**

Create `apps/web/components/growth/SignupBanner.test.tsx`:

```typescript
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignupBanner } from './SignupBanner';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('SignupBanner', () => {
  it('should render banner with signup CTA', () => {
    render(<SignupBanner userCount={150} />);
    expect(screen.getByText(/knowledge builders/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up free/i })).toHaveAttribute(
      'href',
      '/auth/register'
    );
  });

  it('should display user count', () => {
    render(<SignupBanner userCount={150} />);
    expect(screen.getByText(/150/)).toBeInTheDocument();
  });

  it('should be dismissible', () => {
    render(<SignupBanner userCount={150} />);
    const closeButton = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(closeButton);
    expect(screen.queryByText(/knowledge builders/i)).not.toBeInTheDocument();
  });

  it('should not render if dismissed cookie exists', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'mw_banner_dismissed=1',
    });
    render(<SignupBanner userCount={150} />);
    expect(screen.queryByText(/knowledge builders/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test -- --run components/growth/SignupBanner.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement SignupBanner**

Create `apps/web/components/growth/SignupBanner.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics/tracker';

interface SignupBannerProps {
  userCount: number;
}

export function SignupBanner({ userCount }: SignupBannerProps) {
  const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash

  useEffect(() => {
    const isDismissed = document.cookie.includes('mw_banner_dismissed=1');
    setDismissed(isDismissed);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    document.cookie = 'mw_banner_dismissed=1; max-age=604800; path=/'; // 7 days
  };

  const handleCtaClick = () => {
    trackEvent('cta_click', { variant: 'signup_banner' });
  };

  if (dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 px-4 py-3 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Join <span className="font-semibold text-foreground">{userCount}+</span> knowledge
          builders on Mindweave
        </p>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" onClick={handleCtaClick}>
            <Link href="/auth/register">Sign Up Free</Link>
          </Button>
          <button
            onClick={handleDismiss}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `cd apps/web && pnpm test -- --run components/growth/SignupBanner.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/growth/SignupBanner.tsx apps/web/components/growth/SignupBanner.test.tsx
git commit -m "feat(growth): add sticky SignupBanner component for public pages"
```

---

## Task 6: ContextualCTA Component

**Files:**
- Create: `apps/web/components/growth/ContextualCTA.tsx`
- Create: `apps/web/components/growth/ContextualCTA.test.tsx`

- [ ] **Step 1: Write failing test**

Create `apps/web/components/growth/ContextualCTA.test.tsx`:

```typescript
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContextualCTA } from './ContextualCTA';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('ContextualCTA', () => {
  it('should render TIL variant', () => {
    render(<ContextualCTA variant="til" />);
    expect(screen.getByText(/start sharing what you learn/i)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/auth/register');
  });

  it('should render marketplace variant', () => {
    render(<ContextualCTA variant="marketplace" />);
    expect(screen.getByText(/clone this collection/i)).toBeInTheDocument();
  });

  it('should render share variant', () => {
    render(<ContextualCTA variant="share" />);
    expect(screen.getByText(/save this to your mindweave/i)).toBeInTheDocument();
  });

  it('should render profile variant', () => {
    render(<ContextualCTA variant="profile" />);
    expect(screen.getByText(/build your public knowledge profile/i)).toBeInTheDocument();
  });

  it('should render comparison variant', () => {
    render(<ContextualCTA variant="comparison" />);
    expect(screen.getByText(/try mindweave free/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test -- --run components/growth/ContextualCTA.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement ContextualCTA**

Create `apps/web/components/growth/ContextualCTA.tsx`:

```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

type CTAVariant = 'til' | 'marketplace' | 'share' | 'profile' | 'comparison';

const CTA_CONFIG: Record<CTAVariant, { text: string; description: string }> = {
  til: {
    text: 'Start sharing what you learn',
    description: 'Publish your own TILs and join the community.',
  },
  marketplace: {
    text: 'Clone this collection to your library',
    description: 'Sign up to save and organize knowledge your way.',
  },
  share: {
    text: 'Save this to your Mindweave',
    description: 'Build your own AI-powered knowledge hub.',
  },
  profile: {
    text: 'Build your public knowledge profile',
    description: 'Showcase your expertise and share what you know.',
  },
  comparison: {
    text: 'Try Mindweave free',
    description: 'AI-powered knowledge management — no credit card required.',
  },
};

interface ContextualCTAProps {
  variant: CTAVariant;
}

export function ContextualCTA({ variant }: ContextualCTAProps) {
  const config = CTA_CONFIG[variant];

  return (
    <div className="rounded-xl border bg-gradient-to-r from-indigo-50 to-purple-50 p-6 text-center dark:from-indigo-950/30 dark:to-purple-950/30">
      <h3 className="text-lg font-semibold">{config.text}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
      <Button asChild className="mt-4" size="lg">
        <Link href="/auth/register">
          Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `cd apps/web && pnpm test -- --run components/growth/ContextualCTA.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/growth/ContextualCTA.tsx apps/web/components/growth/ContextualCTA.test.tsx
git commit -m "feat(growth): add ContextualCTA component with 5 page variants"
```

---

## Task 7: SocialProofCounters Component

**Files:**
- Create: `apps/web/components/growth/SocialProofCounters.tsx`
- Create: `apps/web/components/growth/SocialProofCounters.test.tsx`

- [ ] **Step 1: Write failing test**

Create `apps/web/components/growth/SocialProofCounters.test.tsx`:

```typescript
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SocialProofCounters } from './SocialProofCounters';

describe('SocialProofCounters', () => {
  it('should render all stat counters', () => {
    render(
      <SocialProofCounters
        tilCount={150}
        collectionCount={45}
        noteCount={1200}
        userCount={89}
      />
    );
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('1,200')).toBeInTheDocument();
    expect(screen.getByText('89')).toBeInTheDocument();
  });

  it('should display stat labels', () => {
    render(
      <SocialProofCounters
        tilCount={0}
        collectionCount={0}
        noteCount={0}
        userCount={0}
      />
    );
    expect(screen.getByText(/TILs Published/i)).toBeInTheDocument();
    expect(screen.getByText(/Collections Shared/i)).toBeInTheDocument();
    expect(screen.getByText(/Notes Captured/i)).toBeInTheDocument();
    expect(screen.getByText(/Knowledge Builders/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — verify fails**

Run: `cd apps/web && pnpm test -- --run components/growth/SocialProofCounters.test.tsx`

- [ ] **Step 3: Implement SocialProofCounters**

Create `apps/web/components/growth/SocialProofCounters.tsx`:

```typescript
import { BookOpen, Library, FileText, Users } from 'lucide-react';

interface SocialProofCountersProps {
  tilCount: number;
  collectionCount: number;
  noteCount: number;
  userCount: number;
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

const STATS = [
  { key: 'tilCount', label: 'TILs Published', icon: BookOpen },
  { key: 'collectionCount', label: 'Collections Shared', icon: Library },
  { key: 'noteCount', label: 'Notes Captured', icon: FileText },
  { key: 'userCount', label: 'Knowledge Builders', icon: Users },
] as const;

export function SocialProofCounters(props: SocialProofCountersProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {STATS.map(({ key, label, icon: Icon }) => (
        <div key={key} className="text-center">
          <Icon className="mx-auto h-5 w-5 text-muted-foreground" />
          <div className="mt-1 text-2xl font-bold">{formatNumber(props[key])}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `cd apps/web && pnpm test -- --run components/growth/SocialProofCounters.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/growth/SocialProofCounters.tsx apps/web/components/growth/SocialProofCounters.test.tsx
git commit -m "feat(growth): add SocialProofCounters component"
```

---

## Task 8: Integrate Conversion Components Into Public Pages

**Files:**
- Modify: `apps/web/app/til/page.tsx`
- Modify: `apps/web/app/til/[tilId]/page.tsx`
- Modify: `apps/web/app/marketplace/[listingId]/page.tsx`
- Modify: `apps/web/app/share/[shareId]/page.tsx`
- Modify: `apps/web/app/profile/[username]/page.tsx`
- Modify: `apps/web/app/page.tsx` (homepage)

- [ ] **Step 1: Read all target files**

Read each file to understand current structure before modifying.

- [ ] **Step 2: Add SignupBanner + ContextualCTA to TIL pages**

In `apps/web/app/til/page.tsx`:
- Import `SignupBanner` and `ContextualCTA`
- Import `getSocialProofStats`
- Fetch stats in `Promise.all` alongside existing fetches
- Add `<ContextualCTA variant="til" />` at the bottom (only if `!session?.user`)
- Add `<SignupBanner userCount={stats.userCount} />` (only if `!session?.user`)

In `apps/web/app/til/[tilId]/page.tsx`:
- Same pattern — add contextual CTA for unauthenticated visitors

- [ ] **Step 3: Add CTAs to marketplace, share, profile pages**

Each page gets:
- `<ContextualCTA variant="marketplace|share|profile" />` for unauthenticated visitors
- Check if auth session exists; only show CTA when `!session?.user`

- [ ] **Step 4: Add SocialProofCounters to homepage**

In `apps/web/app/page.tsx`:
- Import `SocialProofCounters` and `getSocialProofStats`
- Fetch stats server-side
- Add counters in the hero section below the CTA button
- Update hero headline to be conversion-focused (e.g., "Your AI-Powered Second Brain")
- Add trust signals: "Free forever for individuals", "No credit card required"

- [ ] **Step 5: Test locally**

Run: `cd apps/web && pnpm dev`
Visit `/til`, `/marketplace`, `/share/[any-id]`, `/profile/[any-username]`, `/`
Expected: CTAs visible on all public pages when not logged in. SignupBanner at bottom of TIL pages.

- [ ] **Step 6: Run full test suite**

Run: `cd apps/web && pnpm test -- --run`
Expected: All existing tests pass. Fix any broken tests from layout changes.

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/til/ apps/web/app/marketplace/ apps/web/app/share/ apps/web/app/profile/ apps/web/app/page.tsx
git commit -m "feat(growth): integrate conversion CTAs and social proof into all public pages"
```

---

## Task 9: ShareButton Component

**Files:**
- Create: `apps/web/components/growth/ShareButton.tsx`
- Create: `apps/web/components/growth/ShareButton.test.tsx`

- [ ] **Step 1: Write failing test**

Create `apps/web/components/growth/ShareButton.test.tsx`:

```typescript
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareButton } from './ShareButton';

// Mock window.open
const mockOpen = vi.fn();
vi.stubGlobal('open', mockOpen);

// Mock clipboard
Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

describe('ShareButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render share button', () => {
    render(<ShareButton url="https://mindweave.space/til/123" title="My TIL" />);
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
  });

  it('should show dropdown with share options on click', () => {
    render(<ShareButton url="https://mindweave.space/til/123" title="My TIL" />);
    fireEvent.click(screen.getByRole('button', { name: /share/i }));
    expect(screen.getByText(/twitter/i)).toBeInTheDocument();
    expect(screen.getByText(/linkedin/i)).toBeInTheDocument();
    expect(screen.getByText(/reddit/i)).toBeInTheDocument();
    expect(screen.getByText(/copy link/i)).toBeInTheDocument();
  });

  it('should open Twitter share URL', () => {
    render(<ShareButton url="https://mindweave.space/til/123" title="My TIL" />);
    fireEvent.click(screen.getByRole('button', { name: /share/i }));
    fireEvent.click(screen.getByText(/twitter/i));
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank'
    );
  });

  it('should copy link to clipboard', async () => {
    render(<ShareButton url="https://mindweave.space/til/123" title="My TIL" />);
    fireEvent.click(screen.getByRole('button', { name: /share/i }));
    fireEvent.click(screen.getByText(/copy link/i));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://mindweave.space/til/123'
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test -- --run components/growth/ShareButton.test.tsx`

- [ ] **Step 3: Implement ShareButton**

Create `apps/web/components/growth/ShareButton.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Share2, Twitter, Linkedin, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { trackEvent } from '@/lib/analytics/tracker';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'icon';
}

export function ShareButton({
  url,
  title,
  description,
  variant = 'outline',
  size = 'sm',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description || title);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
  };

  const handleShare = (platform: string) => {
    trackEvent('share_click', { platform, url });
    window.open(shareLinks[platform as keyof typeof shareLinks], '_blank');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    trackEvent('share_click', { platform: 'copy_link', url });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} aria-label="Share">
          <Share2 className="h-4 w-4" />
          {size !== 'icon' && <span className="ml-2">Share</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleShare('twitter')}>
          <Twitter className="mr-2 h-4 w-4" />
          Twitter / X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('linkedin')}>
          <Linkedin className="mr-2 h-4 w-4" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('reddit')}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Reddit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopy}>
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {copied ? 'Copied!' : 'Copy Link'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `cd apps/web && pnpm test -- --run components/growth/ShareButton.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/growth/ShareButton.tsx apps/web/components/growth/ShareButton.test.tsx
git commit -m "feat(growth): add universal ShareButton with Twitter, LinkedIn, Reddit, Copy Link"
```

---

## Task 10: ShareNudge Component (Post-Action Modal)

**Files:**
- Create: `apps/web/components/growth/ShareNudge.tsx`
- Create: `apps/web/components/growth/ShareNudge.test.tsx`

- [ ] **Step 1: Write failing test**

Create `apps/web/components/growth/ShareNudge.test.tsx`:

```typescript
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareNudge } from './ShareNudge';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('ShareNudge', () => {
  it('should render when open', () => {
    render(
      <ShareNudge
        open={true}
        onClose={() => {}}
        title="My First TIL"
        url="https://mindweave.space/til/123"
        actionType="til_published"
      />
    );
    expect(screen.getByText(/share this with your network/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <ShareNudge
        open={false}
        onClose={() => {}}
        title="My First TIL"
        url="https://mindweave.space/til/123"
        actionType="til_published"
      />
    );
    expect(screen.queryByText(/share this/i)).not.toBeInTheDocument();
  });

  it('should call onClose when dismissed', () => {
    const onClose = vi.fn();
    render(
      <ShareNudge
        open={true}
        onClose={onClose}
        title="My First TIL"
        url="https://mindweave.space/til/123"
        actionType="til_published"
      />
    );
    fireEvent.click(screen.getByText(/maybe later/i));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test — verify fails**

Run: `cd apps/web && pnpm test -- --run components/growth/ShareNudge.test.tsx`

- [ ] **Step 3: Implement ShareNudge**

Create `apps/web/components/growth/ShareNudge.tsx`:

```typescript
'use client';

import { ShareButton } from './ShareButton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface ShareNudgeProps {
  open: boolean;
  onClose: () => void;
  title: string;
  url: string;
  actionType: string;
}

export function ShareNudge({ open, onClose, title, url, actionType }: ShareNudgeProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Nice work!
          </DialogTitle>
          <DialogDescription>Share this with your network?</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm font-medium">{title}</p>
          <div className="flex items-center gap-2">
            <ShareButton url={url} title={title} size="default" />
            <Button variant="ghost" onClick={onClose}>
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `cd apps/web && pnpm test -- --run components/growth/ShareNudge.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/growth/ShareNudge.tsx apps/web/components/growth/ShareNudge.test.tsx
git commit -m "feat(growth): add ShareNudge post-action modal"
```

---

## Task 11: Integrate ShareButton Into Existing Pages

**Files:**
- Modify: `apps/web/app/til/[tilId]/page.tsx`
- Modify: `apps/web/app/marketplace/[listingId]/page.tsx`
- Modify: `apps/web/app/share/[shareId]/page.tsx`
- Modify: `apps/web/app/wrapped/[wrappedId]/page.tsx`

- [ ] **Step 1: Read target files**

Read each file to find the right insertion points.

- [ ] **Step 2: Add ShareButton to TIL detail page**

In `apps/web/app/til/[tilId]/page.tsx`:
- Import `ShareButton`
- Add `<ShareButton url={tilUrl} title={til.title} />` next to existing action buttons
- Build URL from `NEXT_PUBLIC_APP_URL` + `/til/${tilId}`

- [ ] **Step 3: Add ShareButton to marketplace listing, share page, wrapped page**

Same pattern for each — add ShareButton near the title/header area.

- [ ] **Step 4: Test locally**

Run: `cd apps/web && pnpm dev`
Visit TIL detail, marketplace listing, share page — verify ShareButton appears.

- [ ] **Step 5: Run full test suite**

Run: `cd apps/web && pnpm test -- --run`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/til/ apps/web/app/marketplace/ apps/web/app/share/ apps/web/app/wrapped/
git commit -m "feat(growth): integrate ShareButton into TIL, marketplace, share, and wrapped pages"
```

---

## Task 12: Dynamic OG Images for TIL Posts

**Files:**
- Create: `apps/web/app/api/og/til/route.tsx`

- [ ] **Step 1: Read existing OG route for reference**

Read `apps/web/app/api/og/embed/route.tsx` to copy the exact pattern.

- [ ] **Step 2: Implement TIL OG image route**

Create `apps/web/app/api/og/til/route.tsx`:

```typescript
import { ImageResponse } from 'next/og';
import { db } from '@/lib/db/client';
import { tilPosts, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tilId = searchParams.get('id');

  if (!tilId) {
    return new Response('Missing id', { status: 400 });
  }

  const post = await db
    .select({
      title: tilPosts.title,
      tags: tilPosts.tags,
      authorName: users.name,
    })
    .from(tilPosts)
    .leftJoin(users, eq(tilPosts.userId, users.id))
    .where(eq(tilPosts.id, tilId))
    .limit(1);

  if (!post[0]) {
    return new Response('Not found', { status: 404 });
  }

  const { title, tags, authorName } = post[0];
  const displayTags = (tags || []).slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #a855f7)',
          fontFamily: 'system-ui, sans-serif',
          color: 'white',
        }}
      >
        <div style={{ fontSize: '24px', opacity: 0.8, marginBottom: '16px' }}>
          Today I Learned
        </div>
        <div style={{ fontSize: '48px', fontWeight: 'bold', lineHeight: 1.2, maxWidth: '900px' }}>
          {title}
        </div>
        {displayTags.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
            {displayTags.map((tag: string) => (
              <div
                key={tag}
                style={{
                  padding: '6px 16px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.2)',
                  fontSize: '18px',
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'auto',
            paddingTop: '32px',
          }}
        >
          <div style={{ fontSize: '20px', opacity: 0.8 }}>
            by {authorName || 'Anonymous'}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>mindweave.space</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

- [ ] **Step 3: Update TIL detail page metadata to use dynamic OG image**

In `apps/web/app/til/[tilId]/page.tsx`, update `generateMetadata` to include:

```typescript
openGraph: {
  images: [`${baseUrl}/api/og/til?id=${tilId}`],
},
twitter: {
  card: 'summary_large_image',
  images: [`${baseUrl}/api/og/til?id=${tilId}`],
},
```

- [ ] **Step 4: Test locally**

Run: `cd apps/web && pnpm dev`
Visit `http://localhost:3000/api/og/til?id=[any-til-id]`
Expected: Purple gradient image with TIL title, tags, author.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/api/og/til/ apps/web/app/til/
git commit -m "feat(growth): add dynamic OG images for TIL posts"
```

---

## Task 13: TIL Topic Pages

**Files:**
- Create: `apps/web/app/til/topic/[tag]/page.tsx`
- Modify: `apps/web/app/sitemap.ts`

- [ ] **Step 1: Implement topic page**

Create `apps/web/app/til/topic/[tag]/page.tsx`:

```typescript
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db/client';
import { tilPosts } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { TilGrid } from '@/components/til/TilGrid';
import { ContextualCTA } from '@/components/growth/ContextualCTA';
import { JsonLd } from '@/components/seo/JsonLd';

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const title = `TIL: ${decodedTag} — Today I Learned | Mindweave`;
  const description = `Browse community TILs about ${decodedTag}. Bite-sized learnings from the Mindweave community.`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'website', siteName: 'Mindweave' },
    twitter: { card: 'summary', title, description },
  };
}

export default async function TilTopicPage({ params }: Props) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const session = await auth();

  // Fetch TILs with this tag
  const posts = await db
    .select()
    .from(tilPosts)
    .where(sql`${decodedTag} = ANY(${tilPosts.tags})`)
    .orderBy(sql`${tilPosts.publishedAt} DESC`)
    .limit(50);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `TIL: ${decodedTag}`,
          description: `Community learnings about ${decodedTag}`,
        }}
      />
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">TIL: {decodedTag}</h1>
        <p className="text-muted-foreground">
          {posts.length} learnings about {decodedTag} from the community
        </p>
      </div>

      <TilGrid
        initialPosts={posts}
        initialTotal={posts.length}
        isAuthenticated={!!session?.user}
      />

      {!session?.user && <ContextualCTA variant="til" />}
    </div>
  );
}
```

- [ ] **Step 2: Add topic pages to sitemap**

Read `apps/web/app/sitemap.ts`, then add a `getTopicEntries()` function:

```typescript
async function getTopicEntries(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  try {
    const tags = await db.execute<{ tag: string }>(sql`
      SELECT DISTINCT unnest(tags) as tag FROM til_posts
      GROUP BY tag HAVING COUNT(*) >= 3
    `);
    return tags.map((t) => ({
      url: `${baseUrl}/til/topic/${encodeURIComponent(t.tag)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
    }));
  } catch {
    return [];
  }
}
```

Add `getTopicEntries(baseUrl)` to the `Promise.all()` and spread into the return array.

- [ ] **Step 3: Test locally**

Run: `cd apps/web && pnpm dev`
Visit `/til/topic/javascript` (or any tag that exists)
Expected: Page renders with filtered TILs.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/til/topic/ apps/web/app/sitemap.ts
git commit -m "feat(growth): add TIL topic pages with SEO and sitemap integration"
```

---

## Task 14: Trending TILs Page

**Files:**
- Create: `apps/web/app/til/trending/page.tsx`

- [ ] **Step 1: Implement trending page**

Create `apps/web/app/til/trending/page.tsx`:

```typescript
import { Metadata } from 'next';
import { db } from '@/lib/db/client';
import { tilPosts, tilUpvotes } from '@/lib/db/schema';
import { sql, desc, gte } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { TilGrid } from '@/components/til/TilGrid';
import { ContextualCTA } from '@/components/growth/ContextualCTA';
import { JsonLd } from '@/components/seo/JsonLd';

export const revalidate = 86400; // 24 hours ISR

export const metadata: Metadata = {
  title: 'Trending TILs — Today I Learned | Mindweave',
  description:
    "See what the Mindweave community learned this week. The most upvoted TILs from the past 7 days.",
  openGraph: {
    title: 'Trending TILs — Mindweave',
    description: "This week's most popular learnings from the community.",
    type: 'website',
    siteName: 'Mindweave',
  },
};

export default async function TrendingTilPage() {
  const session = await auth();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Fetch top TILs by upvote count in past 7 days
  // Adapt this query to match actual schema — tilPosts may have an upvoteCount column
  // or you may need to join with tilUpvotes and count
  const result = await db
    .select()
    .from(tilPosts)
    .where(gte(tilPosts.publishedAt, sevenDaysAgo))
    .orderBy(desc(tilPosts.upvoteCount))
    .limit(30);

  return (
    <div className="space-y-6">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Trending TILs',
          description: "This week's most popular learnings",
        }}
      />
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Trending This Week</h1>
        <p className="text-muted-foreground">
          The most upvoted learnings from the past 7 days
        </p>
      </div>

      <TilGrid
        initialPosts={result}
        initialTotal={result.length}
        isAuthenticated={!!session?.user}
      />

      {!session?.user && <ContextualCTA variant="til" />}
    </div>
  );
}
```

**Note:** Check the actual `tilPosts` schema for the upvote column name — it may be `upvoteCount`, `upvotes`, or require a join with `tilUpvotes`. Adapt the query accordingly.

- [ ] **Step 2: Add to sitemap**

In `apps/web/app/sitemap.ts`, add `/til/trending` to static entries.

- [ ] **Step 3: Test locally and commit**

```bash
git add apps/web/app/til/trending/ apps/web/app/sitemap.ts
git commit -m "feat(growth): add trending TILs page with 24h ISR"
```

---

## Task 15: Referrals Schema & Actions

**Files:**
- Modify: `apps/web/lib/db/schema.ts`
- Create: `apps/web/app/actions/referrals.ts`
- Create: `apps/web/app/actions/referrals.test.ts`
- Create: `apps/web/app/r/[username]/route.ts`

- [ ] **Step 1: Add referrals table to schema**

In `apps/web/lib/db/schema.ts`:

```typescript
export const referrals = pgTable('referrals', {
  id: uuid('id').primaryKey().defaultRandom(),
  referrerId: uuid('referrer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  referredUserId: uuid('referred_user_id').references(() => users.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('pending'), // pending | signed_up | activated
  clickCount: integer('click_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  convertedAt: timestamp('converted_at', { mode: 'date' }),
});
```

- [ ] **Step 2: Generate migration and push**

Run: `cd apps/web && pnpm db:generate && pnpm db:push`

- [ ] **Step 3: Write failing test for referral actions**

Create `apps/web/app/actions/referrals.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockDbQuery, mockDbInsert, mockDbUpdate } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDbQuery: { users: { findFirst: vi.fn() }, referrals: { findFirst: vi.fn() } },
  mockDbInsert: vi.fn().mockResolvedValue(undefined),
  mockDbUpdate: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
}));

vi.mock('@/lib/auth', () => ({ auth: () => mockAuth() }));
vi.mock('@/lib/db/client', () => ({
  db: {
    query: mockDbQuery,
    insert: () => ({ values: mockDbInsert }),
    update: () => ({ set: () => ({ where: mockDbUpdate }) }),
  },
}));
vi.mock('@/lib/db/schema', () => ({
  users: {},
  referrals: {},
}));

import { trackReferralClick, getReferralStats } from './referrals';

describe('Referral Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    });
  });

  it('should track a referral click for valid username', async () => {
    mockDbQuery.users.findFirst.mockResolvedValue({ id: 'referrer-456', username: 'alice' });
    mockDbQuery.referrals.findFirst.mockResolvedValue(null);
    const result = await trackReferralClick('alice');
    expect(result.success).toBe(true);
    expect(mockDbInsert).toHaveBeenCalled();
  });

  it('should fail for invalid username', async () => {
    mockDbQuery.users.findFirst.mockResolvedValue(null);
    const result = await trackReferralClick('nonexistent');
    expect(result.success).toBe(false);
  });

  it('should return referral stats for authenticated user', async () => {
    const result = await getReferralStats();
    expect(result).toBeDefined();
  });
});
```

- [ ] **Step 4: Implement referral actions**

Create `apps/web/app/actions/referrals.ts`:

```typescript
'use server';

import { db } from '@/lib/db/client';
import { referrals, users } from '@/lib/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function trackReferralClick(
  username: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const referrer = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!referrer) {
      return { success: false, message: 'User not found.' };
    }

    // Upsert: increment click_count if row exists, else create
    const existing = await db.query.referrals.findFirst({
      where: and(
        eq(referrals.referrerId, referrer.id),
        eq(referrals.status, 'pending')
      ),
    });

    if (existing) {
      await db
        .update(referrals)
        .set({ clickCount: sql`${referrals.clickCount} + 1` })
        .where(eq(referrals.id, existing.id));
    } else {
      await db.insert(referrals).values({
        referrerId: referrer.id,
        clickCount: 1,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error tracking referral:', error);
    return { success: false, message: 'Failed to track referral.' };
  }
}

export async function getReferralStats(): Promise<{
  success: boolean;
  data?: {
    referralLink: string;
    totalClicks: number;
    totalSignups: number;
    totalActivated: number;
  };
  message?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized.' };
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    const stats = await db.execute<{
      total_clicks: number;
      total_signups: number;
      total_activated: number;
    }>(sql`
      SELECT
        COALESCE(SUM(click_count), 0)::int as total_clicks,
        COUNT(*) FILTER (WHERE status IN ('signed_up', 'activated'))::int as total_signups,
        COUNT(*) FILTER (WHERE status = 'activated')::int as total_activated
      FROM referrals
      WHERE referrer_id = ${session.user.id}
    `);

    const row = stats[0] ?? { total_clicks: 0, total_signups: 0, total_activated: 0 };
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mindweave.space';

    return {
      success: true,
      data: {
        referralLink: `${baseUrl}/r/${user?.username || session.user.id}`,
        totalClicks: row.total_clicks,
        totalSignups: row.total_signups,
        totalActivated: row.total_activated,
      },
    };
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return { success: false, message: 'Failed to get stats.' };
  }
}
```

- [ ] **Step 5: Implement referral redirect route**

Create `apps/web/app/r/[username]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { trackReferralClick } from '@/app/actions/referrals';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mindweave.space';

  // Track the click
  await trackReferralClick(username);

  // Set referrer cookie and redirect to homepage
  const response = NextResponse.redirect(baseUrl);
  response.cookies.set('mw_referrer', username, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return response;
}
```

- [ ] **Step 6: Run tests**

Run: `cd apps/web && pnpm test -- --run app/actions/referrals.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib/db/schema.ts apps/web/app/actions/referrals.ts apps/web/app/actions/referrals.test.ts apps/web/app/r/ apps/web/drizzle/
git commit -m "feat(growth): add referral system with tracking, stats, and redirect route"
```

---

## Task 16: Referrer Badge Definitions

**Files:**
- Modify: `apps/web/lib/badges/definitions.ts`
- Modify: `apps/web/lib/badges/engine.ts`

- [ ] **Step 1: Read badge definitions and engine**

Read `apps/web/lib/badges/definitions.ts` and `apps/web/lib/badges/engine.ts` to understand the exact pattern.

- [ ] **Step 2: Add Referrer badge category and 3 badges**

In `apps/web/lib/badges/definitions.ts`, add to `BADGE_CATEGORIES`:

```typescript
{
  id: 'referrer',
  name: 'Referrer',
  description: 'Growing the community through referrals',
},
```

Add 3 badges to `BADGE_DEFINITIONS`:

```typescript
{
  id: 'community-builder',
  name: 'Community Builder',
  description: 'Referred 3 users to Mindweave',
  icon: '🤝',
  category: 'referrer',
  trigger: 'referralActivated' as BadgeTrigger,
  threshold: 3,
},
{
  id: 'growth-champion',
  name: 'Growth Champion',
  description: 'Referred 10 users to Mindweave',
  icon: '📣',
  category: 'referrer',
  trigger: 'referralActivated' as BadgeTrigger,
  threshold: 10,
},
{
  id: 'mindweave-ambassador',
  name: 'Mindweave Ambassador',
  description: 'Referred 25 users to Mindweave',
  icon: '🏛️',
  category: 'referrer',
  trigger: 'referralActivated' as BadgeTrigger,
  threshold: 25,
},
```

- [ ] **Step 3: Add referral checker to engine**

In `apps/web/lib/badges/engine.ts`, add a checker for `referrer` category:

```typescript
referrer_count: async (userId) => {
  const result = await db
    .select({ value: count() })
    .from(referrals)
    .where(
      and(
        eq(referrals.referrerId, userId),
        eq(referrals.status, 'activated')
      )
    );
  return result[0]?.value ?? 0;
},
```

Import `referrals` from schema. Add `'referralActivated'` to the `BadgeTrigger` type if not already there.

- [ ] **Step 4: Run full test suite**

Run: `cd apps/web && pnpm test -- --run`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/badges/definitions.ts apps/web/lib/badges/engine.ts
git commit -m "feat(growth): add Referrer badge category with 3 badges"
```

---

## Task 17: Referral Dashboard Page

**Files:**
- Create: `apps/web/app/dashboard/settings/referrals/page.tsx`
- Create: `apps/web/components/referral/ReferralDashboard.tsx`
- Create: `apps/web/components/referral/ReferralDashboard.test.tsx`

- [ ] **Step 1: Write failing test for ReferralDashboard component**

Create `apps/web/components/referral/ReferralDashboard.test.tsx`:

```typescript
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReferralDashboard } from './ReferralDashboard';

Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

describe('ReferralDashboard', () => {
  const defaultProps = {
    referralLink: 'https://mindweave.space/r/alice',
    totalClicks: 42,
    totalSignups: 8,
    totalActivated: 5,
  };

  it('should display referral link', () => {
    render(<ReferralDashboard {...defaultProps} />);
    expect(screen.getByDisplayValue(defaultProps.referralLink)).toBeInTheDocument();
  });

  it('should display stats', () => {
    render(<ReferralDashboard {...defaultProps} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should copy link on button click', () => {
    render(<ReferralDashboard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(defaultProps.referralLink);
  });
});
```

- [ ] **Step 2: Run test — verify fails**

Run: `cd apps/web && pnpm test -- --run components/referral/ReferralDashboard.test.tsx`

- [ ] **Step 3: Implement ReferralDashboard component**

Create `apps/web/components/referral/ReferralDashboard.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Copy, Check, MousePointerClick, UserPlus, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShareButton } from '@/components/growth/ShareButton';

interface ReferralDashboardProps {
  referralLink: string;
  totalClicks: number;
  totalSignups: number;
  totalActivated: number;
}

export function ReferralDashboard({
  referralLink,
  totalClicks,
  totalSignups,
  totalActivated,
}: ReferralDashboardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Your Referral Link</h3>
        <p className="text-sm text-muted-foreground">
          Share this link to invite friends. You'll earn badges as they join.
        </p>
        <div className="mt-2 flex gap-2">
          <Input value={referralLink} readOnly className="font-mono text-sm" />
          <Button variant="outline" size="icon" onClick={handleCopy} aria-label="Copy link">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
          <ShareButton
            url={referralLink}
            title="Join me on Mindweave — your AI-powered knowledge hub"
            size="icon"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4 text-center">
          <MousePointerClick className="mx-auto h-5 w-5 text-muted-foreground" />
          <div className="mt-1 text-2xl font-bold">{totalClicks}</div>
          <div className="text-xs text-muted-foreground">Link Clicks</div>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <UserPlus className="mx-auto h-5 w-5 text-muted-foreground" />
          <div className="mt-1 text-2xl font-bold">{totalSignups}</div>
          <div className="text-xs text-muted-foreground">Signups</div>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <UserCheck className="mx-auto h-5 w-5 text-muted-foreground" />
          <div className="mt-1 text-2xl font-bold">{totalActivated}</div>
          <div className="text-xs text-muted-foreground">Active Users</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create the referral settings page**

Create `apps/web/app/dashboard/settings/referrals/page.tsx`:

```typescript
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getReferralStats } from '@/app/actions/referrals';
import { ReferralDashboard } from '@/components/referral/ReferralDashboard';

export const metadata: Metadata = {
  title: 'Referrals — Mindweave',
};

export default async function ReferralsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const result = await getReferralStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Referrals</h2>
        <p className="text-muted-foreground">
          Invite friends and earn badges as they join Mindweave.
        </p>
      </div>

      {result.success && result.data ? (
        <ReferralDashboard
          referralLink={result.data.referralLink}
          totalClicks={result.data.totalClicks}
          totalSignups={result.data.totalSignups}
          totalActivated={result.data.totalActivated}
        />
      ) : (
        <p className="text-muted-foreground">Unable to load referral data.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run tests**

Run: `cd apps/web && pnpm test -- --run components/referral/ReferralDashboard.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/referral/ apps/web/app/dashboard/settings/referrals/
git commit -m "feat(growth): add referral dashboard page with stats and copy/share"
```

---

## Task 18: TIL Article JSON-LD & Internal Linking

**Files:**
- Modify: `apps/web/app/til/[tilId]/page.tsx`

- [ ] **Step 1: Read TIL detail page**

Read `apps/web/app/til/[tilId]/page.tsx` to understand current structure.

- [ ] **Step 2: Add Article JSON-LD schema**

In the TIL detail page, add after the page content:

```typescript
<JsonLd
  data={{
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: til.title,
    author: { '@type': 'Person', name: til.authorName },
    datePublished: til.publishedAt?.toISOString(),
    keywords: til.tags?.join(', '),
    publisher: {
      '@type': 'Organization',
      name: 'Mindweave',
      url: 'https://mindweave.space',
    },
  }}
/>
```

- [ ] **Step 3: Add internal links section**

Below the TIL content, add "More by this author" and "Related TILs" sections:

- Query for other TILs by the same author (limit 3)
- Query for TILs with overlapping tags (limit 3)
- Render as linked cards: `<Link href={/til/${id}}>{title}</Link>`
- These queries can be server-side in the page component

- [ ] **Step 4: Run tests and verify**

Run: `cd apps/web && pnpm test -- --run`
Run: `cd apps/web && pnpm dev` and visit a TIL detail page.
Expected: JSON-LD in page source, related TILs section visible.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/til/
git commit -m "feat(growth): add Article JSON-LD and internal linking to TIL detail pages"
```

---

## Task 19: Admin Analytics Dashboard

**Files:**
- Create: `apps/web/app/dashboard/admin/analytics/page.tsx`

- [ ] **Step 1: Create analytics dashboard page**

Create `apps/web/app/dashboard/admin/analytics/page.tsx`:

```typescript
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { analyticsEvents } from '@/lib/db/schema';
import { sql, desc, gte } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Analytics — Mindweave Admin',
};

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');
  // TODO: Add admin check — for now, any authenticated user can view

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Daily pageviews for past 7 days
  const dailyViews = await db.execute<{ day: string; count: number }>(sql`
    SELECT DATE(created_at) as day, COUNT(*)::int as count
    FROM analytics_events
    WHERE event = 'page_view' AND created_at >= ${sevenDaysAgo}
    GROUP BY DATE(created_at)
    ORDER BY day DESC
  `);

  // Top pages
  const topPages = await db.execute<{ page: string; count: number }>(sql`
    SELECT page, COUNT(*)::int as count
    FROM analytics_events
    WHERE event = 'page_view' AND created_at >= ${sevenDaysAgo}
    GROUP BY page
    ORDER BY count DESC
    LIMIT 10
  `);

  // Top referral sources
  const topSources = await db.execute<{ source: string; count: number }>(sql`
    SELECT COALESCE(utm_source, 'direct') as source, COUNT(*)::int as count
    FROM analytics_events
    WHERE created_at >= ${sevenDaysAgo}
    GROUP BY COALESCE(utm_source, 'direct')
    ORDER BY count DESC
    LIMIT 10
  `);

  // Signup funnel
  const funnelStats = await db.execute<{ event: string; count: number }>(sql`
    SELECT event, COUNT(*)::int as count
    FROM analytics_events
    WHERE event IN ('page_view', 'cta_click', 'signup_complete')
      AND created_at >= ${sevenDaysAgo}
    GROUP BY event
  `);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Analytics</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        {funnelStats.map((stat) => (
          <div key={stat.event} className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground capitalize">
              {stat.event.replace('_', ' ')}
            </div>
            <div className="text-3xl font-bold">{stat.count}</div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-2 text-lg font-semibold">Daily Pageviews (7 days)</h3>
        <div className="space-y-1">
          {dailyViews.map((row) => (
            <div key={row.day} className="flex items-center gap-2 text-sm">
              <span className="w-24 text-muted-foreground">{row.day}</span>
              <div
                className="h-4 rounded bg-indigo-500"
                style={{ width: `${Math.min(row.count * 2, 400)}px` }}
              />
              <span>{row.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-lg font-semibold">Top Pages</h3>
          <div className="space-y-1">
            {topPages.map((row) => (
              <div key={row.page} className="flex justify-between text-sm">
                <span className="truncate">{row.page}</span>
                <span className="font-mono">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-lg font-semibold">Top Sources</h3>
          <div className="space-y-1">
            {topSources.map((row) => (
              <div key={row.source} className="flex justify-between text-sm">
                <span>{row.source}</span>
                <span className="font-mono">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Test locally**

Run: `cd apps/web && pnpm dev`
Visit `/dashboard/admin/analytics`
Expected: Page renders with analytics data (empty at first, but no errors).

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/dashboard/admin/analytics/
git commit -m "feat(growth): add admin analytics dashboard with pageviews, sources, and funnel"
```

---

## Task 20: Invite Email Template & Send Action

**Files:**
- Create: `apps/web/lib/email/templates/invite.ts`
- Modify: `apps/web/app/actions/referrals.ts`

- [ ] **Step 1: Create invite email template**

Create `apps/web/lib/email/templates/invite.ts`:

```typescript
export function getInviteEmailHtml(
  inviterName: string,
  referralLink: string
): string {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">${inviterName} invited you to Mindweave</h2>
      <p>Mindweave is an AI-powered knowledge hub that helps you capture, organize, and rediscover your ideas, notes, and learnings.</p>
      <p>
        <a href="${referralLink}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Join Mindweave Free
        </a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">Free forever for individuals. No credit card required.</p>
    </div>
  `;
}
```

- [ ] **Step 2: Add sendInviteEmails action**

In `apps/web/app/actions/referrals.ts`, add:

```typescript
import { getInviteEmailHtml } from '@/lib/email/templates/invite';
import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendInviteEmails(
  emails: string[]
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized.' };
    }

    if (!emails.length || emails.length > 5) {
      return { success: false, message: 'Provide 1-5 email addresses.' };
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mindweave.space';
    const referralLink = `${baseUrl}/r/${user?.username || session.user.id}`;
    const inviterName = user?.name || 'Someone';
    const html = getInviteEmailHtml(inviterName, referralLink);

    const resend = getResend();
    for (const email of emails) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: email,
        subject: `${inviterName} invited you to Mindweave`,
        html,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending invite emails:', error);
    return { success: false, message: 'Failed to send invites.' };
  }
}
```

- [ ] **Step 3: Run tests**

Run: `cd apps/web && pnpm test -- --run app/actions/referrals.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/email/templates/invite.ts apps/web/app/actions/referrals.ts
git commit -m "feat(growth): add invite email template and sendInviteEmails action"
```

---

## Task 21: New User Activation Email Sequence

**Files:**
- Create: `apps/web/lib/email/templates/activation.ts`
- Create: `apps/web/lib/email/triggers.ts`

- [ ] **Step 1: Create activation email templates**

Create `apps/web/lib/email/templates/activation.ts`:

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mindweave.space';

interface ActivationEmail {
  subject: string;
  html: string;
  dayOffset: number;
}

export function getActivationEmails(userName: string): ActivationEmail[] {
  return [
    {
      dayOffset: 0,
      subject: 'Welcome to Mindweave!',
      html: `
        <h2>Welcome, ${userName}!</h2>
        <p>You're now part of the Mindweave community. Start by capturing your first note.</p>
        <a href="${BASE_URL}/dashboard/capture" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;">Capture Your First Note</a>
      `,
    },
    {
      dayOffset: 1,
      subject: 'Capture from anywhere with our browser extension',
      html: `
        <h2>Save anything in one click</h2>
        <p>Install the Mindweave browser extension to capture notes, highlights, and links from any page.</p>
        <a href="https://chromewebstore.google.com/detail/mindweave-quick-capture/dijnigojjcgddengnjlohamenopgpelp" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;">Install Extension</a>
      `,
    },
    {
      dayOffset: 3,
      subject: 'Share what you learned today',
      html: `
        <h2>Publish your first TIL</h2>
        <p>TILs (Today I Learned) are bite-sized learnings you share with the community. It's the best way to solidify what you learn.</p>
        <a href="${BASE_URL}/dashboard/capture" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;">Write a TIL</a>
      `,
    },
    {
      dayOffset: 5,
      subject: 'Discover community collections',
      html: `
        <h2>Learn from the community</h2>
        <p>The Mindweave Marketplace has curated collections from other knowledge builders. Clone one to jumpstart your library.</p>
        <a href="${BASE_URL}/marketplace" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;">Explore Marketplace</a>
      `,
    },
    {
      dayOffset: 7,
      subject: 'Build your public knowledge profile',
      html: `
        <h2>Showcase your expertise</h2>
        <p>Set up your public profile and share it with your network. It's your personal knowledge portfolio.</p>
        <a href="${BASE_URL}/dashboard/settings" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;">Set Up Profile</a>
      `,
    },
  ];
}
```

- [ ] **Step 2: Create email trigger logic**

Create `apps/web/lib/email/triggers.ts`:

```typescript
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { sql, gte, lte } from 'drizzle-orm';
import { Resend } from 'resend';
import { getActivationEmails } from './templates/activation';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Send activation drip emails to users in their first 7 days.
 * Designed to be called by a cron job (Cloud Scheduler) daily.
 */
export async function sendActivationDripEmails(): Promise<{
  sent: number;
  errors: number;
}> {
  const resend = getResend();
  let sent = 0;
  let errors = 0;

  // Find users who signed up in the last 8 days
  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
  const recentUsers = await db
    .select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt })
    .from(users)
    .where(gte(users.createdAt, eightDaysAgo));

  for (const user of recentUsers) {
    const daysSinceSignup = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (24 * 60 * 60 * 1000)
    );

    const emails = getActivationEmails(user.name || 'there');
    const todayEmail = emails.find((e) => e.dayOffset === daysSinceSignup);

    if (todayEmail) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: user.email,
          subject: todayEmail.subject,
          html: todayEmail.html,
        });
        sent++;
      } catch (error) {
        console.error(`Error sending activation email to ${user.email}:`, error);
        errors++;
      }
    }
  }

  return { sent, errors };
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/email/templates/activation.ts apps/web/lib/email/triggers.ts
git commit -m "feat(growth): add new user activation email drip sequence (5 emails over 7 days)"
```

---

## Task 22: Weekly TIL Digest Page

**Files:**
- Create: `apps/web/app/til/weekly/page.tsx`

- [ ] **Step 1: Implement weekly digest page**

Create `apps/web/app/til/weekly/page.tsx`:

```typescript
import { Metadata } from 'next';
import { db } from '@/lib/db/client';
import { tilPosts } from '@/lib/db/schema';
import { desc, gte } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { TilGrid } from '@/components/til/TilGrid';
import { ContextualCTA } from '@/components/growth/ContextualCTA';
import { ShareButton } from '@/components/growth/ShareButton';
import { JsonLd } from '@/components/seo/JsonLd';

export const revalidate = 86400; // 24 hours

export const metadata: Metadata = {
  title: "This Week's Best TILs — Mindweave",
  description: "A curated collection of the best TILs from the Mindweave community this week.",
  openGraph: {
    title: "This Week's Best TILs — Mindweave",
    description: "What the community learned this week.",
    type: 'website',
  },
};

export default async function WeeklyTilPage() {
  const session = await auth();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const posts = await db
    .select()
    .from(tilPosts)
    .where(gte(tilPosts.publishedAt, sevenDaysAgo))
    .orderBy(desc(tilPosts.upvoteCount))
    .limit(20);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mindweave.space';

  return (
    <div className="space-y-6">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: "This Week's Best TILs",
          description: "Curated learnings from the Mindweave community",
        }}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">This Week's Best TILs</h1>
          <p className="text-muted-foreground">
            Curated from the Mindweave community
          </p>
        </div>
        <ShareButton
          url={`${baseUrl}/til/weekly`}
          title="This Week's Best TILs — Mindweave"
        />
      </div>

      <TilGrid
        initialPosts={posts}
        initialTotal={posts.length}
        isAuthenticated={!!session?.user}
      />

      {!session?.user && <ContextualCTA variant="til" />}
    </div>
  );
}
```

- [ ] **Step 2: Add to sitemap**

In `apps/web/app/sitemap.ts`, add `/til/weekly` and `/til/trending` to static entries.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/til/weekly/ apps/web/app/sitemap.ts
git commit -m "feat(growth): add weekly TIL digest page"
```

---

## Task 23: Creator Content Stats (Dashboard Widget)

**Files:**
- Modify: `apps/web/app/actions/analytics.ts`

- [ ] **Step 1: Add getCreatorStats action**

In `apps/web/app/actions/analytics.ts`, add:

```typescript
export async function getCreatorStats(): Promise<{
  success: boolean;
  data?: {
    tilViewsThisWeek: number;
    totalTilViews: number;
    collectionsCloned: number;
    topTilTitle: string | null;
    topTilViews: number;
  };
  message?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized.' };
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Query analytics_events for TIL page views by this user's content
    // This requires joining with tilPosts to find the user's TILs
    const result = await db.execute<{
      views_this_week: number;
      total_views: number;
      top_til_title: string | null;
      top_til_views: number;
    }>(sql`
      WITH user_tils AS (
        SELECT id, title FROM til_posts WHERE user_id = ${session.user.id}
      ),
      til_views AS (
        SELECT
          ut.title,
          COUNT(*) FILTER (WHERE ae.created_at >= ${sevenDaysAgo})::int as views_week,
          COUNT(*)::int as views_total
        FROM analytics_events ae
        JOIN user_tils ut ON ae.page = '/til/' || ut.id::text
        WHERE ae.event = 'page_view'
        GROUP BY ut.id, ut.title
      )
      SELECT
        COALESCE(SUM(views_week), 0)::int as views_this_week,
        COALESCE(SUM(views_total), 0)::int as total_views,
        (SELECT title FROM til_views ORDER BY views_week DESC LIMIT 1) as top_til_title,
        COALESCE((SELECT views_week FROM til_views ORDER BY views_week DESC LIMIT 1), 0)::int as top_til_views
    `);

    const row = result[0] ?? {
      views_this_week: 0,
      total_views: 0,
      top_til_title: null,
      top_til_views: 0,
    };

    return {
      success: true,
      data: {
        tilViewsThisWeek: row.views_this_week,
        totalTilViews: row.total_views,
        collectionsCloned: 0, // TODO: integrate with marketplace clone tracking
        topTilTitle: row.top_til_title,
        topTilViews: row.top_til_views,
      },
    };
  } catch (error) {
    console.error('Error fetching creator stats:', error);
    return { success: false, message: 'Failed to fetch creator stats.' };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/actions/analytics.ts
git commit -m "feat(growth): add getCreatorStats action for dashboard content performance"
```

---

## Task 24: Traction Notification Email Templates

**Files:**
- Create: `apps/web/lib/email/templates/traction.ts`

- [ ] **Step 1: Create traction email templates**

Create `apps/web/lib/email/templates/traction.ts`:

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mindweave.space';

export function getTilViewMilestoneEmail(
  tilTitle: string,
  tilId: string,
  viewCount: number
): { subject: string; html: string } {
  const subjects: Record<number, string> = {
    10: 'Your TIL is getting noticed!',
    50: 'Your TIL is trending on Mindweave',
    100: '100 people learned from your TIL!',
  };

  return {
    subject: subjects[viewCount] || `Your TIL hit ${viewCount} views!`,
    html: `
      <h2>${subjects[viewCount] || `${viewCount} views!`}</h2>
      <p>Your TIL "<strong>${tilTitle}</strong>" has been viewed ${viewCount} times.</p>
      <p><a href="${BASE_URL}/til/${tilId}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;">View Your TIL</a></p>
      <p style="color:#6b7280;font-size:14px;">Keep sharing — every TIL helps someone learn something new.</p>
    `,
  };
}

export function getCollectionClonedEmail(
  collectionName: string,
  clonerName: string
): { subject: string; html: string } {
  return {
    subject: `${clonerName} just cloned your collection`,
    html: `
      <h2>Your collection was cloned!</h2>
      <p><strong>${clonerName}</strong> cloned your collection "<strong>${collectionName}</strong>" to their library.</p>
      <p><a href="${BASE_URL}/marketplace" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;">View Marketplace</a></p>
    `,
  };
}

export function getWeeklyCreatorDigestEmail(params: {
  userName: string;
  tilViewsThisWeek: number;
  viewsChangePercent: number;
  topTilTitle: string | null;
  topTilViews: number;
}): { subject: string; html: string } {
  return {
    subject: `Your TILs got ${params.tilViewsThisWeek} views this week`,
    html: `
      <h2>Your Weekly Creator Update</h2>
      <p>Hi ${params.userName},</p>
      <p>Your TILs got <strong>${params.tilViewsThisWeek} views</strong> this week
        ${params.viewsChangePercent > 0 ? `(+${params.viewsChangePercent}% from last week)` : ''}.
      </p>
      ${params.topTilTitle ? `<p>Top TIL: <strong>${params.topTilTitle}</strong> — ${params.topTilViews} views</p>` : ''}
      <p><a href="${BASE_URL}/dashboard/capture" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;">Share Your Next TIL</a></p>
    `,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/email/templates/traction.ts
git commit -m "feat(growth): add traction notification email templates (views, clones, weekly digest)"
```

---

## Task 25: Homepage Hero Optimization

**Files:**
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Read current homepage**

Read `apps/web/app/page.tsx` to understand the current hero structure.

- [ ] **Step 2: Optimize hero section for conversion**

Modify the hero section of `apps/web/app/page.tsx`:

- Replace existing headline with a clear value proposition
- Add social proof counters below the CTA (fetch via `getSocialProofStats()`)
- Add trust signals: "Free forever", "No credit card", "Privacy-first"
- Ensure primary CTA button is prominent and links to `/auth/register`

Key changes:
- Import `SocialProofCounters` and `getSocialProofStats`
- Fetch stats at the top of the server component
- Update hero copy and layout

- [ ] **Step 3: Test locally**

Run: `cd apps/web && pnpm dev`
Visit homepage — verify new hero, social proof, trust signals.

- [ ] **Step 4: Run tests**

Run: `cd apps/web && pnpm test -- --run`
Expected: All tests pass. Fix any snapshot/rendering tests affected by hero changes.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat(growth): optimize homepage hero for conversion with social proof and trust signals"
```

---

## Task 26: Quality Gates & Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `cd apps/web && pnpm test -- --run`
Expected: All tests pass (2,675+ existing + new tests).

- [ ] **Step 2: Type check**

Run: `pnpm type-check`
Expected: No TypeScript errors.

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: No linting errors.

- [ ] **Step 4: Build**

Run: `pnpm build`
Expected: Production build succeeds.

- [ ] **Step 5: Manual verification**

Run: `cd apps/web && pnpm dev` and verify:
- [ ] Homepage shows social proof counters and conversion-focused hero
- [ ] TIL page shows ContextualCTA for unauthenticated visitors
- [ ] TIL detail page has ShareButton, JSON-LD, internal links, dynamic OG image
- [ ] `/til/topic/[tag]` renders filtered TILs
- [ ] `/til/trending` shows top TILs
- [ ] `/til/weekly` shows weekly digest
- [ ] `/r/[username]` sets referrer cookie and redirects
- [ ] `/dashboard/settings/referrals` shows referral link and stats
- [ ] `/dashboard/admin/analytics` shows analytics dashboard
- [ ] ShareButton works on TIL detail, marketplace listing, share pages
- [ ] SignupBanner appears on public pages for unauthenticated visitors

- [ ] **Step 6: Commit any fixes**

If any quality gate failures, fix them and commit.

---

## Summary

| Task | What It Builds | Workstream |
|------|---------------|------------|
| 1 | Analytics events schema + action | Analytics (W5) |
| 2 | Client-side tracker + beacon API | Analytics (W5) |
| 3 | Session cookie middleware | Analytics (W5) |
| 4 | Social proof stats action | Conversion (W1) |
| 5 | SignupBanner component | Conversion (W1) |
| 6 | ContextualCTA component | Conversion (W1) |
| 7 | SocialProofCounters component | Conversion (W1) |
| 8 | Integrate CTAs into public pages | Conversion (W1) |
| 9 | ShareButton component | Sharing (W2) |
| 10 | ShareNudge modal | Sharing (W2) |
| 11 | Integrate ShareButton into pages | Sharing (W2) |
| 12 | Dynamic OG images for TILs | Amplification (W4) |
| 13 | TIL topic pages | Amplification (W4) |
| 14 | Trending TILs page | Amplification (W4) |
| 15 | Referrals schema + actions | Referrals (W3) |
| 16 | Referrer badges | Referrals (W3) |
| 17 | Referral dashboard page | Referrals (W3) |
| 18 | TIL JSON-LD + internal linking | Amplification (W4) |
| 19 | Admin analytics dashboard | Analytics (W5) |
| 20 | Invite email template + action | Referrals (W3) |
| 21 | Activation email drip sequence | Engagement (W6) |
| 22 | Weekly TIL digest page | Amplification (W4) |
| 23 | Creator content stats | Analytics (W5) |
| 24 | Traction email templates | Engagement (W6) |
| 25 | Homepage hero optimization | Conversion (W1) |
| 26 | Quality gates & verification | All |

**26 tasks, ~130 steps.** Tasks 1-8 are highest priority (analytics + conversion). Tasks can be executed by parallel subagents where there are no dependencies (e.g., Tasks 5/6/7 can run in parallel; Tasks 9/10 can run in parallel).

## Follow-Up Tasks (Not In This Plan)

These spec items are deferred to a follow-up plan to keep scope focused on the core flywheel:

- **Share Preview Card** (Spec 2.3) — Inline OG card preview before sharing
- **Milestone Share Prompts** (Spec 2.4) — Dynamic stats images for streak/milestone sharing
- **Invite Form UI** (Spec 3.4) — InviteForm component integrated into referral dashboard
- **Collection Invite Attribution** (Spec 3.5) — Referral tracking for collection invites
- **Streak Protection Nudge** (Spec 6.3) — Push/email nudge for streak protection
- **Review-to-TIL Conversion** (Spec 6.4) — Smart Review Queue → TIL conversion flow
- **Post-Signup Quick Win** (Spec 1.5) — Onboarding extension to auto-create first TIL
- **Cross-Page Internal Linking** (Spec 4.5) — Marketplace→profile, profile→TILs, topic→topic links
