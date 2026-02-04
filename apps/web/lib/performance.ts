/**
 * Performance monitoring utilities
 * Tracks execution time for operations and reports metrics
 */

import { logger } from './logger';

interface PerformanceMetric {
  operation: string;
  durationMs: number;
  success: boolean;
  metadata?: Record<string, unknown>;
}

interface TimerResult<T> {
  result: T;
  durationMs: number;
}

/**
 * Measures the execution time of an async function
 */
export async function measureAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<TimerResult<T>> {
  const start = performance.now();
  let success = true;

  try {
    const result = await fn();
    return {
      result,
      durationMs: Math.round(performance.now() - start),
    };
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const durationMs = Math.round(performance.now() - start);
    logMetric({ operation, durationMs, success, metadata });
  }
}

/**
 * Measures the execution time of a sync function
 */
export function measureSync<T>(
  operation: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): TimerResult<T> {
  const start = performance.now();
  let success = true;

  try {
    const result = fn();
    return {
      result,
      durationMs: Math.round(performance.now() - start),
    };
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const durationMs = Math.round(performance.now() - start);
    logMetric({ operation, durationMs, success, metadata });
  }
}

/**
 * Creates a timer that can be stopped manually
 */
export function createTimer(operation: string, metadata?: Record<string, unknown>) {
  const start = performance.now();

  return {
    stop: (success = true) => {
      const durationMs = Math.round(performance.now() - start);
      logMetric({ operation, durationMs, success, metadata });
      return durationMs;
    },
  };
}

/**
 * Logs a performance metric
 */
function logMetric(metric: PerformanceMetric): void {
  const { operation, durationMs, success, metadata } = metric;

  // Log slow operations as warnings
  const isSlowOperation = durationMs > getSlowThreshold(operation);

  if (isSlowOperation) {
    logger.warn(`Slow operation: ${operation}`, {
      type: 'performance',
      operation,
      durationMs,
      success,
      slow: true,
      ...metadata,
    });
  } else {
    logger.info(`Operation completed: ${operation}`, {
      type: 'performance',
      operation,
      durationMs,
      success,
      ...metadata,
    });
  }
}

/**
 * Get slow threshold for different operation types
 */
function getSlowThreshold(operation: string): number {
  if (operation.startsWith('db.')) return 100; // DB queries > 100ms
  if (operation.startsWith('ai.')) return 5000; // AI calls > 5s
  if (operation.startsWith('api.')) return 1000; // API routes > 1s
  if (operation.startsWith('action.')) return 500; // Server actions > 500ms
  return 1000; // Default 1s
}

/**
 * Wraps a server action with performance monitoring
 */
export function withPerformance<TArgs extends unknown[], TResult>(
  actionName: string,
  action: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const { result } = await measureAsync(`action.${actionName}`, () => action(...args));
    return result;
  };
}

/**
 * Performance stats collector for aggregated metrics
 */
class PerformanceStats {
  private metrics: Map<string, number[]> = new Map();
  private readonly maxSamples = 100;

  record(operation: string, durationMs: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    const samples = this.metrics.get(operation)!;
    samples.push(durationMs);

    // Keep only the last maxSamples
    if (samples.length > this.maxSamples) {
      samples.shift();
    }
  }

  getStats(operation: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const samples = this.metrics.get(operation);
    if (!samples || samples.length === 0) return null;

    const sorted = [...samples].sort((a, b) => a - b);
    const count = sorted.length;

    return {
      count,
      avg: Math.round(sorted.reduce((a, b) => a + b, 0) / count),
      min: sorted[0],
      max: sorted[count - 1],
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
    };
  }

  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const result: Record<string, ReturnType<typeof this.getStats>> = {};
    for (const operation of this.metrics.keys()) {
      result[operation] = this.getStats(operation);
    }
    return result;
  }

  clear(): void {
    this.metrics.clear();
  }
}

// Singleton instance for collecting stats
export const performanceStats = new PerformanceStats();
