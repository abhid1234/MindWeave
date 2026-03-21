# Product-Led Growth Engine — Design Spec

**Date**: 2026-03-21
**Status**: Draft
**Goal**: Drive Mindweave adoption from near-zero to meaningful organic growth through product-built viral loops and conversion mechanics.

## Context

Mindweave is a fully-featured AI knowledge hub (30+ features) in soft launch at mindweave.space. Current adoption is near zero — primarily the creator and a few testers. The product has extensive public-facing surfaces (TIL feed, marketplace, profiles, embeds, share links, Knowledge Wrapped, SEO landing pages) but lacks the conversion mechanics and viral loops to turn visitors into users.

**Constraints:**
- No ad budget — code and hustle only
- Target audience: knowledge workers, developers, students, researchers
- Channels: Reddit, Twitter/X, LinkedIn, Hacker News, Product Hunt, organic search
- Two problems to solve: discovery (nobody knows it exists) and conversion (visitors don't sign up)

## Architecture: The Growth Flywheel

```
CREATE → SHARE → CONVERT → CREATE (repeat)
```

1. **Create**: User saves content, writes TILs, builds collections
2. **Share**: Content gets public URLs, OG images, embed codes — shared on social and indexed by Google
3. **Convert**: Visitors land on public pages, see value, sign up
4. **Repeat**: New users create and share, bringing more visitors

Every user action has a shareable output. Every public page is a landing page. Every share is a marketing impression.

## Workstream 1: Conversion Optimization

The highest-leverage workstream. No point driving traffic to pages that don't convert.

### 1.1 Sticky Signup Banner

A persistent bottom bar on every unauthenticated public page.

- Text: "Join [X] knowledge builders on Mindweave" with signup button
- Dismissible via close button — sets cookie, returns after 7 days
- Does not appear for authenticated users
- Implemented as a shared `<SignupBanner>` component in the public page layout

### 1.2 Contextual CTAs Per Page Type

Each public page type gets a tailored call-to-action relevant to what the visitor is viewing:

| Page | CTA Text | Action |
|------|----------|--------|
| TIL post | "Start sharing what you learn" | → /auth/register |
| Marketplace listing | "Clone this collection to your library" | → /auth/register |
| Share page | "Save this to your Mindweave" | → /auth/register |
| Profile page | "Build your public knowledge profile" | → /auth/register |
| Comparison page | "Try Mindweave free" | → /auth/register |

Implemented as a `<ContextualCTA>` component that accepts `variant` prop.

### 1.3 Social Proof Counters

Real numbers displayed on homepage and public pages:

- Total TILs published
- Total collections shared
- Total notes captured
- Cached DB aggregates (revalidate every hour via ISR or server-side cache)
- Implemented as a `getSocialProofStats()` server function with in-memory cache

### 1.4 Homepage Above-the-Fold Optimization

Current homepage has features and use-cases. Optimize the hero section for conversion:

- **Headline**: Single clear value proposition (e.g., "Your AI-powered second brain")
- **Subheadline**: One sentence explaining the product
- **Demo**: 15-second GIF or short video showing the product in action
- **Social proof**: User count + TIL count + collection count
- **Primary CTA**: "Start Free — No Credit Card" button
- **Trust signals**: "Privacy-first", "Open source", "Free forever for individuals"

### 1.5 Post-Signup Quick Win

Extend the existing 3-step onboarding to include a "quick win":

- After first note capture, offer: "Turn this into a TIL and share it?"
- Auto-generate TIL from note content
- Show the user their public TIL URL immediately
- Demonstrates the public/sharing value within 2 minutes of signup

## Workstream 2: Social Sharing Engine

Frictionless sharing from every shareable surface in the product.

### 2.1 Universal ShareButton Component

A reusable `<ShareButton>` component with dropdown menu. Appears on:

- TIL posts (after publishing)
- Shared content pages
- Collection/marketplace listings
- Knowledge Wrapped
- Public graph snapshots
- Badge unlock toasts

### 2.2 Share Destinations

Each destination opens a pre-filled share dialog:

| Platform | Format |
|----------|--------|
| Twitter/X | `window.open()` with pre-filled tweet text + URL |
| LinkedIn | Share URL with title + description |
| Reddit | Pre-filled title + URL |
| Copy Link | Clipboard API with "Copied!" toast feedback |
| Embed Code | Copy iframe or markdown snippet |

Pre-filled text templates per content type:

- TIL: "TIL: [title] [url] via @mindweave"
- Collection: "Check out this [topic] collection on Mindweave: [url]"
- Wrapped: "My knowledge personality is [type]! [url]"
- Badge: "Just unlocked [badge name] on Mindweave! [url]"

### 2.3 Share Preview Card

Before sharing, show an inline preview of the OG card the recipient will see. Renders the OG image within a mock social card frame. Encourages sharing because it looks professional.

### 2.4 Milestone Share Prompts

When a user hits a milestone, prompt them to share:

- 7-day streak, 30-day streak
- 100th note captured
- First 10 TIL upvotes
- Learning path completed

Generate a dynamic stats image (similar to GitHub contribution graph or Duolingo streak cards). Uses existing `/api/og/` pattern.

### 2.5 Post-Action Share Nudge

After key actions (publish TIL, create collection, complete learning path), show a non-blocking modal:

- "Nice! Share this with your network?"
- One-click share buttons (reuses ShareButton)
- Dismissible
- Rate-limited: once per action type per day max

## Workstream 3: Referral & Invite System

### 3.1 Referral Links

Every user gets a unique referral URL: `mindweave.space/r/[username]`

**Database schema:**

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id),
  referred_user_id UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending | signed_up | activated
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_at TIMESTAMPTZ
);
```

**Flow:**
1. Visitor arrives at `/r/[username]`
2. Server creates a referral row (or increments `click_count` on existing row for this referrer) with `referred_user_id` = null
3. Sets `referrer` cookie (30-day expiry) containing the referrer's username
4. Redirects to homepage
5. On signup, check for referrer cookie → update the referrer's row with `referred_user_id`
6. After referred user creates first content → mark as "activated"

**Note:** Click tracking is per-referrer (not per-visitor). One row per referrer tracks total clicks and the most recent conversion. This is sufficient for badge rewards; per-visitor attribution is a non-goal.

### 3.2 Referral Dashboard

Settings page (`/dashboard/settings/referrals`) showing:

- Referral link with copy button
- Share referral link via ShareButton (reuse from Workstream 2)
- Stats: clicks, signups, activated users
- Rewards/badges earned

### 3.3 Reward Tiers

No monetary rewards. Product perks and badges only:

| Referrals | Reward |
|-----------|--------|
| 3 | "Community Builder" badge + profile flair |
| 10 | Early access to new features (feature flag) |
| 25 | "Mindweave Ambassador" badge on public profile |

Integrates with existing badge system (event-driven engine in `badges.ts`). Add new badge category "Referrer" with 3 badges.

### 3.4 Email Invite Flow

From referral dashboard:

- "Invite Friends" button opens a form
- Enter email addresses (up to 5 at a time)
- Sends invite email via existing Resend setup
- Email contains referral link + brief product description
- Tracks invite status (sent, clicked, signed up)

### 3.5 Collection Invite Extension

Existing collection invite system (`/dashboard/invite/[token]`) extended with referral tracking. If a collection invite leads to a new signup, attribute to the inviter.

## Workstream 4: Public Content Amplification

Make existing public content more discoverable and shareable.

### 4.1 TIL Topic Pages

Auto-generated pages at `/til/topic/[tag]` aggregating TILs by tag.

- Generated from tags with 3+ TILs
- SEO-optimized: title "Today I Learned: [Tag] | Mindweave", meta description, JSON-LD
- Paginated grid of TILs filtered by tag
- Internal links to related topics
- Added to sitemap dynamically
- Target keywords: "TIL javascript", "TIL python", "TIL react", etc.

### 4.2 Trending TILs Page

Public page at `/til/trending`:

- Top TILs by upvotes in past 7 days
- Refreshed daily (ISR with 24h revalidation)
- SEO-indexed
- Shareable — "Here's what the Mindweave community learned this week"

### 4.3 Weekly TIL Digest Page

Public page at `/til/weekly`:

- Curated best-of from past week
- Auto-generated from top-performing TILs
- Shareable URL for social posting
- Can double as content for newsletter/social posts

### 4.4 Dynamic OG Images for TILs

New route at `/api/og/til?id=[tilId]`:

- TIL title (large text)
- Author name + avatar (if available)
- Tag pills (top 3 tags)
- Mindweave branding (logo + URL)
- Purple/indigo gradient background (consistent with brand)
- 1200x630 dimensions for optimal social display

Uses `next/og` ImageResponse, same pattern as existing OG routes.

### 4.5 Internal Linking Network

Every public page links to related content to create a web Google loves:

- TIL detail → "More by this author" + "Related TILs" (by tag overlap)
- Profile → user's TILs + marketplace listings
- Marketplace listing → creator's profile + related collections
- Topic pages → related topic pages

### 4.6 Structured Data Expansion

Extend JSON-LD to all public content:

- TIL posts → `Article` schema (`datePublished`, `author`, `keywords`, `interactionCount`)
- Collections → `ItemList` schema
- Marketplace → `Product` schema (already done)
- Profiles → `Person` schema (already done)
- Topic pages → `CollectionPage` schema

## Workstream 5: Analytics & Funnel Tracking

Built-in, privacy-friendly analytics. No third-party scripts.

### 5.1 Analytics Events Table

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL, -- anonymous UUID from cookie
  user_id UUID REFERENCES users(id), -- null for anonymous visitors
  event TEXT NOT NULL, -- page_view, signup_click, signup_complete, share_click, referral_click, cta_click
  page TEXT NOT NULL, -- URL path
  referrer TEXT, -- HTTP referer header
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  metadata JSONB, -- extra event-specific data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_event ON analytics_events(event);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);

-- Retention: partition by month or run a weekly cleanup cron that deletes raw events older than 90 days
-- (aggregate into daily_stats summary table before deleting)
```

### 5.2 Event Tracking Implementation

- **Server-side**: Middleware that logs `page_view` for public pages. Sets anonymous session cookie if not present. Captures UTM params from query string.
- **Client-side**: Lightweight `trackEvent(event, metadata)` function that sends a beacon to `/api/analytics/event`. Used for clicks (share, CTA, signup).
- No third-party scripts. No cookies beyond session ID. GDPR-friendly.

### 5.3 UTM Parameter Support

All external links include UTM tags:

- `?utm_source=reddit&utm_medium=post&utm_campaign=til-launch`
- `?utm_source=twitter&utm_medium=share&utm_campaign=user-share`
- `?utm_source=referral&utm_medium=link&utm_campaign=[username]`

UTM params stored in analytics_events and in referral cookie for attribution.

### 5.4 Admin Analytics Dashboard

Page at `/dashboard/admin/analytics`:

- Daily/weekly pageview chart (line graph)
- Signup conversion rate: visitors → signup clicks → completions (funnel)
- Top referral sources (table)
- Top-performing public content (which TILs/collections drive most views)
- Referral leaderboard
- Channel breakdown by UTM source

Simple charts using existing patterns (or lightweight library like recharts if not already used).

### 5.5 Creator Content Stats

Visible to all users on their dashboard:

- "Your TILs got X views this week" summary card
- Per-TIL view counts on the library page
- "X people cloned your collection" on marketplace listings
- Motivates content creation and sharing (feeds engagement loops)

## Workstream 6: Engagement Loops

Bring users back and motivate continued creation and sharing.

### 6.1 Traction Notification Emails

Event-triggered emails when public content performs:

| Trigger | Email Subject |
|---------|--------------|
| TIL hits 10 views | "Your TIL is getting noticed!" |
| TIL hits 50 views | "Your TIL is trending on Mindweave" |
| TIL hits 100 views | "100 people learned from your TIL!" |
| Collection cloned | "[Name] just cloned your collection" |
| TIL upvoted (batched daily) | "Your TILs got X upvotes today" |

Uses existing Resend email infrastructure. Batched/debounced to avoid spam — max 1 traction email per day.

### 6.2 Weekly Creator Digest

For users with public content, a weekly email:

- "Your TILs got X views this week (+Y% from last week)"
- "Your top TIL: [title] — [views] views"
- "You're in the top X% of creators this week" (percentile)
- CTA: "Share your next TIL" → deep link to `/dashboard/capture`

Extends existing email digest system. Only sent to users with at least 1 public TIL or marketplace listing.

### 6.3 Streak Protection Nudge

Extend existing streak tracking:

- At 8pm UTC (no timezone tracking needed — simple and predictable), if user hasn't been active today and has a streak ≥ 3 days:
  - Send push notification (existing FCM infrastructure): "Don't lose your X-day streak!"
  - Or email if push not enabled
- Max 1 nudge per day
- Easy to disable in notification settings

### 6.4 Review-to-TIL Conversion

Extend Smart Review Queue:

- After reviewing a content item, show: "Turn this into a TIL?"
- One-click creates a TIL draft from the content's title + body excerpt
- User can edit and publish immediately
- Converts private content into public shareable content — feeds the flywheel

### 6.5 New User Activation Sequence

Time-based email drip for first 7 days after signup:

| Day | Email | CTA |
|-----|-------|-----|
| 0 | Welcome + quick start guide | "Capture your first note" → /dashboard/capture |
| 1 | Browser extension intro | "Install the extension" → Chrome Web Store link (already published) |
| 3 | TIL feature spotlight | "Publish your first TIL" → /dashboard/capture |
| 5 | Marketplace discovery | "Explore community collections" → /marketplace |
| 7 | Profile + sharing | "Share your profile" → /dashboard/settings/profile |

Simple cron job (Cloud Scheduler) checks for users in their first 7 days and sends appropriate email. Skips emails for actions already completed (e.g., don't send "install extension" if they already used it).

## Implementation Priority

Recommended build order based on impact and dependencies:

1. **Conversion Optimization** (Workstream 1) — Fix the funnel first
2. **Analytics & Funnel Tracking** (Workstream 5) — Measure before optimizing further
3. **Social Sharing Engine** (Workstream 2) — Enable sharing
4. **Public Content Amplification** (Workstream 4) — More discoverable content
5. **Engagement Loops** (Workstream 6) — Retain and activate users
6. **Referral & Invite System** (Workstream 3) — Viral growth once there's a base

## What Already Exists (No Rebuild Needed)

- TIL feed, marketplace, public profiles, share links, embeds
- OG image generation (embeds, graphs, wrapped)
- Badge system with event-driven engine
- Email infrastructure (Resend + Cloud Scheduler digests)
- Push notifications (FCM)
- SEO landing pages, comparison pages, JSON-LD, sitemap
- RSS feed for TILs
- Knowledge Wrapped sharing
- 3-step onboarding flow
- Streak tracking

## Success Metrics

- **Week 1-2**: Analytics showing traffic sources and conversion rates
- **Month 1**: 50+ organic signups, 10+ public TILs from new users
- **Month 2**: 200+ signups, referral system generating 10%+ of signups
- **Month 3**: Self-sustaining flywheel — new content drives new traffic drives new signups

## Non-Goals

- Paid advertising or sponsored content
- Complex multi-level referral trees
- Third-party analytics (GA, Mixpanel)
- Native mobile app growth features (focus on web)
- A/B testing infrastructure (premature at this scale)
