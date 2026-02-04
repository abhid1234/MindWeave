import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  measureAsync,
  measureSync,
  createTimer,
  withPerformance,
  performanceStats,
} from './performance';

// Mock the logger
vi.mock('./logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('performance', () => {
  beforeEach(() => {
    performanceStats.clear();
    vi.clearAllMocks();
  });

  describe('measureAsync', () => {
    it('measures async function execution time', async () => {
      const result = await measureAsync('test.operation', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'success';
      });

      expect(result.result).toBe('success');
      expect(result.durationMs).toBeGreaterThanOrEqual(10);
    });

    it('includes metadata in logs', async () => {
      const { logger } = await import('./logger');

      await measureAsync('test.with.metadata', async () => 'done', {
        userId: '123',
      });

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('test.with.metadata'),
        expect.objectContaining({ userId: '123' })
      );
    });

    it('logs error operations correctly', async () => {
      const { logger } = await import('./logger');

      await expect(
        measureAsync('test.error', async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');

      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ success: false })
      );
    });
  });

  describe('measureSync', () => {
    it('measures sync function execution time', () => {
      const result = measureSync('test.sync', () => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000; i++) sum += i;
        return sum;
      });

      expect(result.result).toBe(499500);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('handles errors correctly', () => {
      expect(() =>
        measureSync('test.sync.error', () => {
          throw new Error('Sync error');
        })
      ).toThrow('Sync error');
    });
  });

  describe('createTimer', () => {
    it('creates a manual timer', async () => {
      const timer = createTimer('manual.timer');

      await new Promise((resolve) => setTimeout(resolve, 15));
      const duration = timer.stop();

      expect(duration).toBeGreaterThanOrEqual(15);
    });

    it('supports success parameter', async () => {
      const { logger } = await import('./logger');

      const timer = createTimer('timer.with.success');
      timer.stop(false);

      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ success: false })
      );
    });

    it('includes metadata', async () => {
      const { logger } = await import('./logger');

      const timer = createTimer('timer.metadata', { requestId: 'abc' });
      timer.stop();

      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ requestId: 'abc' })
      );
    });
  });

  describe('withPerformance', () => {
    it('wraps server actions with timing', async () => {
      const mockAction = vi.fn().mockResolvedValue('action result');
      const wrapped = withPerformance('testAction', mockAction);

      const result = await wrapped('arg1', 'arg2');

      expect(result).toBe('action result');
      expect(mockAction).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('preserves action errors', async () => {
      const mockAction = vi.fn().mockRejectedValue(new Error('Action failed'));
      const wrapped = withPerformance('failingAction', mockAction);

      await expect(wrapped()).rejects.toThrow('Action failed');
    });
  });

  describe('performanceStats', () => {
    it('records and retrieves stats', () => {
      performanceStats.record('test.op', 100);
      performanceStats.record('test.op', 150);
      performanceStats.record('test.op', 200);

      const stats = performanceStats.getStats('test.op');

      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(3);
      expect(stats!.min).toBe(100);
      expect(stats!.max).toBe(200);
      expect(stats!.avg).toBe(150);
    });

    it('returns null for unknown operations', () => {
      const stats = performanceStats.getStats('unknown');
      expect(stats).toBeNull();
    });

    it('calculates percentiles correctly', () => {
      // Add 100 samples
      for (let i = 1; i <= 100; i++) {
        performanceStats.record('percentile.test', i);
      }

      const stats = performanceStats.getStats('percentile.test');

      expect(stats).not.toBeNull();
      // Math.floor(100 * 0.5) = 50, sorted[50] = 51 (0-indexed)
      expect(stats!.p50).toBe(51);
      expect(stats!.p95).toBe(96);
      expect(stats!.p99).toBe(100);
    });

    it('limits samples to maxSamples', () => {
      // Add more than maxSamples (100)
      for (let i = 1; i <= 150; i++) {
        performanceStats.record('overflow.test', i);
      }

      const stats = performanceStats.getStats('overflow.test');

      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(100);
      // Should have discarded the first 50
      expect(stats!.min).toBe(51);
    });

    it('getAllStats returns all operations', () => {
      performanceStats.record('op1', 100);
      performanceStats.record('op2', 200);

      const all = performanceStats.getAllStats();

      expect(all['op1']).toBeDefined();
      expect(all['op2']).toBeDefined();
    });

    it('clear removes all stats', () => {
      performanceStats.record('to.clear', 100);
      performanceStats.clear();

      const stats = performanceStats.getStats('to.clear');
      expect(stats).toBeNull();
    });
  });
});
