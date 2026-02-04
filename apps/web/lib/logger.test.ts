import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  describe('development mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('logs info messages with prefix', () => {
      logger.info('Test message');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Test message')
      );
    });

    it('logs debug messages with prefix', () => {
      logger.debug('Debug message');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] Debug message')
      );
    });

    it('logs warn messages with console.warn', () => {
      logger.warn('Warning message');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Warning message')
      );
    });

    it('logs error messages with console.error', () => {
      logger.error('Error message');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Error message')
      );
    });

    it('includes context in log output', () => {
      logger.info('Test with context', { userId: '123', action: 'test' });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('userId')
      );
    });
  });

  describe('production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      // Re-import to get production behavior
      vi.resetModules();
    });

    it('outputs JSON in production', async () => {
      // Import fresh instance with production env
      const { logger: prodLogger } = await import('./logger');

      prodLogger.info('Production message', { key: 'value' });

      expect(console.log).toHaveBeenCalled();
      const logCall = vi.mocked(console.log).mock.calls[0][0];

      // Should be valid JSON
      const parsed = JSON.parse(logCall);
      expect(parsed.severity).toBe('INFO');
      expect(parsed.message).toBe('Production message');
      expect(parsed.service).toBe('mindweave');
      expect(parsed.key).toBe('value');
      expect(parsed.timestamp).toBeDefined();
    });
  });

  describe('log levels', () => {
    it('supports debug level', () => {
      logger.debug('Debug');
      expect(console.log).toHaveBeenCalled();
    });

    it('supports info level', () => {
      logger.info('Info');
      expect(console.log).toHaveBeenCalled();
    });

    it('supports warn level', () => {
      logger.warn('Warn');
      expect(console.warn).toHaveBeenCalled();
    });

    it('supports error level', () => {
      logger.error('Error');
      expect(console.error).toHaveBeenCalled();
    });
  });
});
