const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mindweave.app';

export interface ActivationEmail {
  subject: string;
  html: string;
  dayOffset: number;
}

export function getDay0Email(userName: string): ActivationEmail {
  return {
    dayOffset: 0,
    subject: 'Welcome to Mindweave — capture your first note',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Welcome to Mindweave, ${userName}!</h2>
        <p>You're now part of a community that believes ideas deserve to be remembered.</p>
        <p>Mindweave is your AI-powered personal knowledge hub. Here's how to get started:</p>
        <ol style="padding-left: 20px; line-height: 1.8;">
          <li>Click <strong>Capture</strong> and write your first note</li>
          <li>Add a couple of tags so Mindweave can organise it for you</li>
          <li>Watch the AI auto-tag and embed your idea for instant semantic search</li>
        </ol>
        <p style="margin-top: 24px;">
          <a href="${APP_URL}/dashboard/capture" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Capture your first note</a>
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">You'll hear from us a few more times this week with tips to get the most out of Mindweave.</p>
      </div>
    `,
  };
}

export function getDay1Email(userName: string): ActivationEmail {
  const extensionUrl =
    'https://chromewebstore.google.com/detail/mindweave-quick-capture/dijnigojjcgddengnjlohamenopgpelp';
  return {
    dayOffset: 1,
    subject: 'Capture ideas without leaving your browser',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Hi ${userName} — meet the Mindweave browser extension</h2>
        <p>The quickest way to save anything you find online is with our Chrome extension.</p>
        <ul style="padding-left: 20px; line-height: 1.8;">
          <li>Save any article or page with one click</li>
          <li>Highlight text and send it straight to Mindweave</li>
          <li>AI tags it automatically — no effort needed</li>
        </ul>
        <p style="margin-top: 24px;">
          <a href="${extensionUrl}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Add to Chrome — it's free</a>
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">Works on Chrome and any Chromium-based browser (Edge, Brave, Arc).</p>
      </div>
    `,
  };
}

export function getDay3Email(userName: string): ActivationEmail {
  return {
    dayOffset: 3,
    subject: "Share what you're learning — try TIL",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Hi ${userName} — share a bite-sized learning with TIL</h2>
        <p><strong>Today I Learned (TIL)</strong> is Mindweave's public feed for micro-learnings.</p>
        <p>Turn one of your notes into a short post — others can upvote it and discover something new, and your public profile grows with every TIL you publish.</p>
        <p style="margin-top: 24px;">
          <a href="${APP_URL}/dashboard/library" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Publish your first TIL</a>
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">TIL posts are public and indexed by search engines — great for building your reputation as a learner.</p>
      </div>
    `,
  };
}

export function getDay5Email(userName: string): ActivationEmail {
  return {
    dayOffset: 5,
    subject: 'Discover curated knowledge collections',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Hi ${userName} — explore the Mindweave Marketplace</h2>
        <p>The <strong>Marketplace</strong> is where community members share curated knowledge collections on every topic imaginable.</p>
        <p>Find a collection that matches your interests, clone it with one click, and instantly add hundreds of curated resources to your own library.</p>
        <p style="margin-top: 24px;">
          <a href="${APP_URL}/marketplace" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Browse the Marketplace</a>
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">You can publish your own collections too — it's a great way to give back to the community.</p>
      </div>
    `,
  };
}

export function getDay7Email(userName: string): ActivationEmail {
  return {
    dayOffset: 7,
    subject: 'Your public profile is waiting — share your knowledge',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Hi ${userName} — build your public knowledge profile</h2>
        <p>Everything you've captured and every TIL you've published can be surfaced on your public Mindweave profile.</p>
        <p>A shareable profile link lets you show the world what you're learning — useful for job seekers, writers, and lifelong learners alike.</p>
        <p style="margin-top: 24px;">
          <a href="${APP_URL}/dashboard/profile" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Set up your public profile</a>
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">You can keep your profile private if you prefer — it's always your choice.</p>
      </div>
    `,
  };
}

/** All activation emails indexed by dayOffset for easy lookup. */
export const ACTIVATION_EMAILS: Record<number, (userName: string) => ActivationEmail> = {
  0: getDay0Email,
  1: getDay1Email,
  3: getDay3Email,
  5: getDay5Email,
  7: getDay7Email,
};
