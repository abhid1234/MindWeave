// Interval duration map in milliseconds
const INTERVAL_MS: Record<string, number> = {
  '1d': 1 * 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

// Spaced repetition progression: after processing at one interval, advance to the next
const INTERVAL_PROGRESSION: Record<string, string | null> = {
  '1d': '3d',
  '3d': '7d',
  '7d': '30d',
  '30d': null, // completed
};

export function getNextRemindAt(interval: string): Date {
  const ms = INTERVAL_MS[interval];
  if (!ms) throw new Error(`Invalid interval: ${interval}`);
  return new Date(Date.now() + ms);
}

export function getNextInterval(currentInterval: string): string | null {
  return INTERVAL_PROGRESSION[currentInterval] ?? null;
}
