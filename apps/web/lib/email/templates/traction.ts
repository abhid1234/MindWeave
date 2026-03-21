const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mindweave.app';

export interface TractionEmail {
  subject: string;
  html: string;
}

/**
 * Email sent when a TIL post reaches a view milestone (10, 50, 100+).
 */
export function getTilViewMilestoneEmail(
  tilTitle: string,
  tilId: string,
  viewCount: number
): TractionEmail {
  const tilUrl = `${APP_URL}/til/${tilId}`;
  const milestone = viewCount >= 100 ? 100 : viewCount >= 50 ? 50 : 10;

  return {
    subject: `Your TIL just hit ${milestone} views!`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Your TIL is gaining traction!</h2>
        <p>
          <strong>&ldquo;${tilTitle}&rdquo;</strong> has now been viewed
          <strong>${viewCount.toLocaleString()} time${viewCount !== 1 ? 's' : ''}</strong>.
          ${milestone >= 100 ? "That's a serious milestone — your insight is resonating with a lot of people." : milestone >= 50 ? 'Keep it up — your ideas are spreading!' : "You're off to a great start!"}
        </p>
        <p style="margin-top: 24px;">
          <a href="${tilUrl}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">View your TIL</a>
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          Share it to keep the momentum going — every share brings new readers.
        </p>
      </div>
    `,
  };
}

/**
 * Email sent when someone clones the creator's collection from the Marketplace.
 */
export function getCollectionClonedEmail(
  collectionName: string,
  clonerName: string
): TractionEmail {
  return {
    subject: `${clonerName} cloned your collection "${collectionName}"`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Your collection was cloned!</h2>
        <p>
          <strong>${clonerName}</strong> just cloned your collection
          <strong>&ldquo;${collectionName}&rdquo;</strong> from the Mindweave Marketplace.
        </p>
        <p>Your curated knowledge is helping others learn and grow — that&rsquo;s what Mindweave is all about.</p>
        <p style="margin-top: 24px;">
          <a href="${APP_URL}/marketplace" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">View Marketplace</a>
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          Consider publishing more collections to grow your reach even further.
        </p>
      </div>
    `,
  };
}

export interface WeeklyCreatorDigestParams {
  creatorName: string;
  tilViewsThisWeek: number;
  tilViewsPreviousWeek: number;
  topTilTitle: string | null;
  topTilId: string | null;
  topTilViews: number;
}

/**
 * Weekly creator digest email summarising content performance.
 */
export function getWeeklyCreatorDigestEmail(params: WeeklyCreatorDigestParams): TractionEmail {
  const {
    creatorName,
    tilViewsThisWeek,
    tilViewsPreviousWeek,
    topTilTitle,
    topTilId,
    topTilViews,
  } = params;

  const changePercent =
    tilViewsPreviousWeek > 0
      ? Math.round(((tilViewsThisWeek - tilViewsPreviousWeek) / tilViewsPreviousWeek) * 100)
      : null;

  const changeLine =
    changePercent !== null
      ? changePercent >= 0
        ? `<span style="color: #16a34a;">+${changePercent}%</span> vs last week`
        : `<span style="color: #dc2626;">${changePercent}%</span> vs last week`
      : 'First week of tracking';

  const topTilSection =
    topTilTitle && topTilId
      ? `
        <p style="margin-top: 16px;">
          <strong>Top performing TIL this week:</strong><br />
          <a href="${APP_URL}/til/${topTilId}" style="color: #4f46e5;">${topTilTitle}</a>
          — ${topTilViews.toLocaleString()} view${topTilViews !== 1 ? 's' : ''}
        </p>
      `
      : '';

  return {
    subject: `Your Mindweave creator digest — ${tilViewsThisWeek.toLocaleString()} TIL view${tilViewsThisWeek !== 1 ? 's' : ''} this week`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Your weekly creator digest, ${creatorName}</h2>
        <p>
          Your TILs received <strong>${tilViewsThisWeek.toLocaleString()} view${tilViewsThisWeek !== 1 ? 's' : ''}</strong> this week
          — ${changeLine}.
        </p>
        ${topTilSection}
        <p style="margin-top: 24px;">
          <a href="${APP_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">View full stats</a>
          <a href="${APP_URL}/dashboard/capture" style="display: inline-block; padding: 12px 24px; background: #f3f4f6; color: #111827; text-decoration: none; border-radius: 8px; font-weight: 600; margin-left: 8px;">Capture a new idea</a>
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          You can adjust your email preferences in
          <a href="${APP_URL}/dashboard/profile" style="color: #6366f1;">Profile Settings</a>.
        </p>
      </div>
    `,
  };
}
