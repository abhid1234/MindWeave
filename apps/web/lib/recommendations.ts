/**
 * Blended scoring for content recommendations.
 *
 * Combines vector similarity with recency and novelty signals
 * to produce a single recommendation score.
 */

const SIMILARITY_WEIGHT = 0.5;
const RECENCY_WEIGHT = 0.2;
const NOVELTY_WEIGHT = 0.3;
const RECENCY_DECAY_DAYS = 90;

/**
 * Calculate a blended recommendation score.
 *
 * @param similarity  - Cosine similarity (0–1) from pgvector
 * @param contentCreatedAt - When the content was created
 * @param lastViewedAt - When the user last viewed this content (null = never viewed)
 * @param now - Current timestamp (injectable for testing)
 * @returns Blended score between 0 and 1
 */
export function calculateBlendedScore(
  similarity: number,
  contentCreatedAt: Date,
  lastViewedAt: Date | null,
  now: Date = new Date()
): number {
  // Recency factor: exponential decay over 90 days
  const ageMs = now.getTime() - contentCreatedAt.getTime();
  const ageInDays = Math.max(0, ageMs / (1000 * 60 * 60 * 24));
  const recencyFactor = Math.exp(-ageInDays / RECENCY_DECAY_DAYS);

  // Novelty bonus based on view history
  let noveltyBonus: number;
  if (lastViewedAt === null) {
    // Never viewed — highest novelty
    noveltyBonus = 1.0;
  } else {
    const viewAgeMs = now.getTime() - lastViewedAt.getTime();
    const viewAgeInDays = Math.max(0, viewAgeMs / (1000 * 60 * 60 * 24));

    if (viewAgeInDays > 7) {
      noveltyBonus = 0.67; // Viewed more than 7 days ago
    } else if (viewAgeInDays >= 1) {
      noveltyBonus = 0.33; // Viewed within the last week but not today
    } else {
      noveltyBonus = 0.0; // Viewed today — no novelty
    }
  }

  return (
    similarity * SIMILARITY_WEIGHT +
    recencyFactor * RECENCY_WEIGHT +
    noveltyBonus * NOVELTY_WEIGHT
  );
}
