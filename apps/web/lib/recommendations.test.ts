import { describe, it, expect } from 'vitest';
import { calculateBlendedScore } from './recommendations';

describe('calculateBlendedScore', () => {
  const now = new Date('2025-06-15T12:00:00Z');

  it('should give high score to new, never-viewed, high-similarity content', () => {
    const contentCreatedAt = new Date('2025-06-15T10:00:00Z'); // created today
    const score = calculateBlendedScore(0.95, contentCreatedAt, null, now);

    // similarity(0.95*0.5=0.475) + recency(~1.0*0.2=0.2) + novelty(1.0*0.3=0.3) ≈ 0.975
    expect(score).toBeGreaterThan(0.9);
  });

  it('should give lower score to old content', () => {
    const oldContent = new Date('2024-06-15T12:00:00Z'); // 1 year old
    const newContent = new Date('2025-06-14T12:00:00Z'); // 1 day old

    const oldScore = calculateBlendedScore(0.8, oldContent, null, now);
    const newScore = calculateBlendedScore(0.8, newContent, null, now);

    expect(newScore).toBeGreaterThan(oldScore);
  });

  it('should give highest novelty to never-viewed content', () => {
    const createdAt = new Date('2025-06-10T12:00:00Z');

    const neverViewed = calculateBlendedScore(0.8, createdAt, null, now);
    const viewedLongAgo = calculateBlendedScore(0.8, createdAt, new Date('2025-05-01T12:00:00Z'), now);
    const viewedRecently = calculateBlendedScore(0.8, createdAt, new Date('2025-06-14T12:00:00Z'), now);
    const viewedToday = calculateBlendedScore(0.8, createdAt, new Date('2025-06-15T08:00:00Z'), now);

    expect(neverViewed).toBeGreaterThan(viewedLongAgo);
    expect(viewedLongAgo).toBeGreaterThan(viewedRecently);
    expect(viewedRecently).toBeGreaterThan(viewedToday);
  });

  it('should give zero novelty bonus for content viewed today', () => {
    const createdAt = new Date('2025-06-10T12:00:00Z');
    const viewedToday = new Date('2025-06-15T06:00:00Z');

    const score = calculateBlendedScore(0.8, createdAt, viewedToday, now);

    // With zero novelty: similarity(0.8*0.5=0.4) + recency + 0
    // Same content without novelty bonus
    const sameWithNovelty = calculateBlendedScore(0.8, createdAt, null, now);
    expect(sameWithNovelty).toBeGreaterThan(score);
  });

  it('should return value between 0 and 1 for typical inputs', () => {
    const createdAt = new Date('2025-06-01T12:00:00Z');

    const score = calculateBlendedScore(0.7, createdAt, null, now);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('should handle zero similarity', () => {
    const createdAt = new Date('2025-06-15T10:00:00Z');

    const score = calculateBlendedScore(0, createdAt, null, now);

    // Should still have recency + novelty components
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it('should handle very old content gracefully', () => {
    const veryOld = new Date('2020-01-01T12:00:00Z');

    const score = calculateBlendedScore(0.9, veryOld, null, now);

    // Recency factor should be very low (near 0 after years)
    // But similarity and novelty should still contribute
    expect(score).toBeGreaterThan(0);
  });

  it('should handle content created in the future without crashing', () => {
    const future = new Date('2026-01-01T12:00:00Z');

    const score = calculateBlendedScore(0.8, future, null, now);

    // ageInDays clamped to 0, so recencyFactor = 1.0
    expect(score).toBeGreaterThan(0);
  });

  it('should produce consistent scores for identical inputs', () => {
    const createdAt = new Date('2025-06-10T12:00:00Z');
    const viewedAt = new Date('2025-06-12T12:00:00Z');

    const score1 = calculateBlendedScore(0.85, createdAt, viewedAt, now);
    const score2 = calculateBlendedScore(0.85, createdAt, viewedAt, now);

    expect(score1).toBe(score2);
  });

  it('should give higher score to higher similarity with same recency/novelty', () => {
    const createdAt = new Date('2025-06-10T12:00:00Z');

    const highSim = calculateBlendedScore(0.95, createdAt, null, now);
    const lowSim = calculateBlendedScore(0.5, createdAt, null, now);

    expect(highSim).toBeGreaterThan(lowSim);
  });

  it('should treat boundary of 7 days correctly', () => {
    const createdAt = new Date('2025-06-01T12:00:00Z');
    const exactlySevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const justOverSevenDays = new Date(now.getTime() - 7.01 * 24 * 60 * 60 * 1000);

    const atBoundary = calculateBlendedScore(0.8, createdAt, exactlySevenDaysAgo, now);
    const overBoundary = calculateBlendedScore(0.8, createdAt, justOverSevenDays, now);

    // At 7 days: viewAgeInDays=7, >=1 so noveltyBonus=0.33
    // Over 7 days: viewAgeInDays>7 so noveltyBonus=0.67
    expect(overBoundary).toBeGreaterThan(atBoundary);
  });
});
