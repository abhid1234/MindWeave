import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMobileAuthToken, verifyMobileAuthToken } from './mobile-auth';

beforeEach(() => {
  process.env.AUTH_SECRET = 'test-secret-key-for-testing';
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createMobileAuthToken', () => {
  it('returns a 2-part token separated by a dot', () => {
    const token = createMobileAuthToken('user-1', 'user@test.com');
    const parts = token.split('.');
    expect(parts).toHaveLength(2);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
  });

  it('payload contains sub, email, iat, and exp fields', () => {
    const token = createMobileAuthToken('user-1', 'user@test.com');
    const [payloadB64] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    expect(payload).toHaveProperty('sub', 'user-1');
    expect(payload).toHaveProperty('email', 'user@test.com');
    expect(payload).toHaveProperty('iat');
    expect(payload).toHaveProperty('exp');
    expect(typeof payload.iat).toBe('number');
    expect(typeof payload.exp).toBe('number');
  });

  it('exp is approximately 120 seconds after iat', () => {
    const token = createMobileAuthToken('user-1', 'user@test.com');
    const [payloadB64] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    expect(payload.exp - payload.iat).toBe(120);
  });
});

describe('verifyMobileAuthToken', () => {
  it('valid roundtrip: create then verify returns {sub, email}', () => {
    const token = createMobileAuthToken('user-1', 'user@test.com');
    const result = verifyMobileAuthToken(token);
    expect(result).toEqual({ sub: 'user-1', email: 'user@test.com' });
  });

  it('returns null for a tampered payload', () => {
    const token = createMobileAuthToken('user-1', 'user@test.com');
    const [, signature] = token.split('.');
    // Create a different payload
    const tamperedPayload = Buffer.from(
      JSON.stringify({ sub: 'hacker', email: 'evil@test.com', iat: 0, exp: 9999999999 })
    ).toString('base64url');
    const tampered = `${tamperedPayload}.${signature}`;
    expect(verifyMobileAuthToken(tampered)).toBeNull();
  });

  it('returns null for a tampered signature', () => {
    const token = createMobileAuthToken('user-1', 'user@test.com');
    const [payloadB64] = token.split('.');
    const tampered = `${payloadB64}.invalidsignaturehere`;
    expect(verifyMobileAuthToken(tampered)).toBeNull();
  });

  it('returns null for a malformed token without dot', () => {
    expect(verifyMobileAuthToken('nodottoken')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(verifyMobileAuthToken('')).toBeNull();
  });

  it('returns null for an expired token', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    const token = createMobileAuthToken('user-1', 'user@test.com');

    // Advance time by 3 minutes (180 seconds) — token expires at 120 seconds
    vi.setSystemTime(now + 180 * 1000);

    const result = verifyMobileAuthToken(token);
    expect(result).toBeNull();
  });

  it('returns valid result for a token that has not yet expired', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    const token = createMobileAuthToken('user-1', 'user@test.com');

    // Advance time by 60 seconds — still within the 120s window
    vi.setSystemTime(now + 60 * 1000);

    const result = verifyMobileAuthToken(token);
    expect(result).toEqual({ sub: 'user-1', email: 'user@test.com' });
  });
});
