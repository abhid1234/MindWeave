import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackEvent } from './tracker';

// ─── browser global mocks ────────────────────────────────────────────────────

const mockSendBeacon = vi.fn();
const mockFetch = vi.fn();

/**
 * A minimal Blob replacement that stores the raw body string so tests can
 * retrieve it synchronously. The real jsdom Blob doesn't expose .text() in
 * the version used by this project, so we polyfill it here.
 */
class MockBlob {
  private _body: string;
  readonly type: string;

  constructor(parts: BlobPart[], options?: BlobPropertyBag) {
    this._body = parts.map((p) => String(p)).join('');
    this.type = options?.type ?? '';
  }

  text(): Promise<string> {
    return Promise.resolve(this._body);
  }

  /** Helper used in tests to synchronously get the parsed JSON payload. */
  parseJson(): unknown {
    return JSON.parse(this._body);
  }
}

function parseFetchBody(body: string): unknown {
  return JSON.parse(body);
}

beforeEach(() => {
  mockSendBeacon.mockReset();
  mockFetch.mockReset();

  // Default: sendBeacon succeeds
  mockSendBeacon.mockReturnValue(true);
  // Default fetch resolves ok
  mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));

  // Replace Blob with our minimal implementation
  Object.defineProperty(globalThis, 'Blob', {
    value: MockBlob,
    configurable: true,
    writable: true,
  });

  // Patch globals
  Object.defineProperty(globalThis, 'navigator', {
    value: { sendBeacon: mockSendBeacon },
    configurable: true,
    writable: true,
  });

  Object.defineProperty(globalThis, 'window', {
    value: {
      location: {
        pathname: '/dashboard',
        search: '?utm_source=google&utm_medium=cpc&utm_campaign=summer',
      },
    },
    configurable: true,
    writable: true,
  });

  Object.defineProperty(globalThis, 'document', {
    value: {
      cookie: 'other_cookie=abc; mw_session=sess_abc123; another=xyz',
      referrer: 'https://example.com',
    },
    configurable: true,
    writable: true,
  });

  Object.defineProperty(globalThis, 'fetch', {
    value: mockFetch,
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── helpers ─────────────────────────────────────────────────────────────────

function getBlobPayload(): unknown {
  const [, blob] = mockSendBeacon.mock.calls[0] as [string, MockBlob];
  return blob.parseJson();
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('trackEvent', () => {
  it('sends event via navigator.sendBeacon with correct payload', () => {
    trackEvent('page_view');

    expect(mockSendBeacon).toHaveBeenCalledOnce();
    const [url] = mockSendBeacon.mock.calls[0] as [string, MockBlob];
    expect(url).toBe('/api/analytics/event');

    const payload = getBlobPayload();
    expect(payload).toMatchObject({
      event: 'page_view',
      page: '/dashboard',
      referrer: 'https://example.com',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'summer',
    });
  });

  it('reads session ID from mw_session cookie', () => {
    trackEvent('signup_click');

    const payload = getBlobPayload();
    expect((payload as { sessionId: string }).sessionId).toBe('sess_abc123');
  });

  it('includes metadata in payload when provided', () => {
    trackEvent('button_click', { buttonId: 'cta-hero', variant: 'A' });

    const payload = getBlobPayload();
    expect((payload as { metadata: unknown }).metadata).toEqual({
      buttonId: 'cta-hero',
      variant: 'A',
    });
  });

  it('does not include metadata key when not provided', () => {
    trackEvent('page_view');

    const payload = getBlobPayload();
    // metadata should be undefined (not present in the serialized JSON)
    expect((payload as { metadata?: unknown }).metadata).toBeUndefined();
  });

  it('falls back to fetch when sendBeacon returns false', () => {
    mockSendBeacon.mockReturnValue(false);

    trackEvent('page_view');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0] as [
      string,
      { method: string; headers: Record<string, string>; body: string; keepalive: boolean },
    ];
    expect(url).toBe('/api/analytics/event');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.keepalive).toBe(true);

    const payload = parseFetchBody(options.body);
    expect((payload as { event: string }).event).toBe('page_view');
  });

  it('falls back to fetch when sendBeacon is not available', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      configurable: true,
      writable: true,
    });

    trackEvent('page_view');

    expect(mockSendBeacon).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('returns an empty sessionId when mw_session cookie is missing', () => {
    Object.defineProperty(globalThis, 'document', {
      value: { cookie: 'other_cookie=abc', referrer: '' },
      configurable: true,
      writable: true,
    });

    trackEvent('page_view');

    const payload = getBlobPayload();
    expect((payload as { sessionId: string }).sessionId).toBe('');
  });

  it('handles missing UTM params (sets them to null)', () => {
    Object.defineProperty(globalThis, 'window', {
      value: { location: { pathname: '/', search: '' } },
      configurable: true,
      writable: true,
    });

    trackEvent('page_view');

    const payload = getBlobPayload() as {
      utmSource: string | null;
      utmMedium: string | null;
      utmCampaign: string | null;
    };
    expect(payload.utmSource).toBeNull();
    expect(payload.utmMedium).toBeNull();
    expect(payload.utmCampaign).toBeNull();
  });

  it('does nothing when window is undefined (SSR guard)', () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error intentionally deleting window to simulate SSR
    delete globalThis.window;

    expect(() => trackEvent('page_view')).not.toThrow();
    expect(mockSendBeacon).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();

    globalThis.window = originalWindow;
  });
});
