/**
 * Client-side analytics tracker.
 * Reads session ID from the `mw_session` cookie and UTM params from the URL,
 * then sends events to the beacon API endpoint.
 */

export interface TrackEventMetadata {
  [key: string]: unknown;
}

export interface AnalyticsPayload {
  sessionId: string;
  event: string;
  page: string;
  referrer: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  metadata?: TrackEventMetadata;
}

/**
 * Read the value of `mw_session` from `document.cookie`.
 * Returns an empty string if the cookie is not found.
 */
function getSessionId(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)mw_session=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Extract UTM parameters from the current URL search string.
 */
function getUtmParams(search: string): {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
} {
  const params = new URLSearchParams(search);
  return {
    utmSource: params.get('utm_source'),
    utmMedium: params.get('utm_medium'),
    utmCampaign: params.get('utm_campaign'),
  };
}

const BEACON_URL = '/api/analytics/event';

/**
 * Track an analytics event.
 *
 * Reads `mw_session` cookie for session ID and UTM params from the current
 * URL, then sends the payload to the beacon API via `navigator.sendBeacon`
 * with a `fetch` fallback.
 */
export function trackEvent(event: string, metadata?: TrackEventMetadata): void {
  if (typeof window === 'undefined') return;

  const sessionId = getSessionId();
  const { utmSource, utmMedium, utmCampaign } = getUtmParams(window.location.search);

  const payload: AnalyticsPayload = {
    sessionId,
    event,
    page: window.location.pathname,
    referrer: document.referrer,
    utmSource,
    utmMedium,
    utmCampaign,
    metadata,
  };

  const body = JSON.stringify(payload);
  const blob = new Blob([body], { type: 'application/json' });

  // Prefer sendBeacon (fire-and-forget, survives page unload)
  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(BEACON_URL, blob);
    if (sent) return;
  }

  // Fallback to fetch (keepalive so it survives navigation)
  fetch(BEACON_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // Silently ignore network errors in analytics
  });
}
