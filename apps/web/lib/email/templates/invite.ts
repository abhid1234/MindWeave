export function getInviteEmailHtml(inviterName: string, referralLink: string): string {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">${inviterName} invited you to Mindweave</h2>
      <p>Mindweave is an AI-powered knowledge hub that helps you capture, organize, and rediscover your ideas, notes, and learnings.</p>
      <p><a href="${referralLink}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Join Mindweave Free</a></p>
      <p style="color: #6b7280; font-size: 14px;">Free forever for individuals. No credit card required.</p>
    </div>
  `;
}
