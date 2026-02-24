import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock db chain methods
const mockWhere = vi.fn().mockResolvedValue([]);
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
const mockSetWhere = vi.fn().mockResolvedValue(undefined);
const mockSet = vi.fn().mockReturnValue({ where: mockSetWhere });
const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

vi.mock('./db/client', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

vi.mock('./db/schema', () => ({
  devices: {
    id: 'id',
    token: 'token',
    userId: 'userId',
    isActive: 'isActive',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => args),
  and: vi.fn((...args: unknown[]) => args),
}));

// Mock google-auth-library
const mockGetAccessToken = vi.fn().mockResolvedValue({ token: 'mock-access-token' });
const mockGetClient = vi.fn().mockResolvedValue({ getAccessToken: mockGetAccessToken });
const MockGoogleAuth = vi.fn(function (this: Record<string, unknown>) {
  this.getClient = mockGetClient;
});

vi.mock('google-auth-library', () => ({
  GoogleAuth: MockGoogleAuth,
}));

// Mock global fetch
const mockFetch = vi.fn();

describe('sendPushNotification', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    // Reset chain mocks
    mockWhere.mockResolvedValue([]);
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });
    mockSetWhere.mockResolvedValue(undefined);
    mockSet.mockReturnValue({ where: mockSetWhere });
    mockUpdate.mockReturnValue({ set: mockSet });
    mockGetAccessToken.mockResolvedValue({ token: 'mock-access-token' });
    mockGetClient.mockResolvedValue({ getAccessToken: mockGetAccessToken });
    // Install fetch mock
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it('should return {sent:0, failed:0} when FCM_PROJECT_ID is not set', async () => {
    delete process.env.FCM_PROJECT_ID;
    const { sendPushNotification } = await import('./push-notifications');

    const result = await sendPushNotification('user-1', 'Title', 'Body');

    expect(result).toEqual({ sent: 0, failed: 0 });
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('should return {sent:0, failed:0} when no active devices exist', async () => {
    process.env.FCM_PROJECT_ID = 'test-project';
    mockWhere.mockResolvedValue([]);

    const { sendPushNotification } = await import('./push-notifications');
    const result = await sendPushNotification('user-1', 'Title', 'Body');

    expect(result).toEqual({ sent: 0, failed: 0 });
    expect(mockSelect).toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should send notification successfully and return {sent:1, failed:0}', async () => {
    process.env.FCM_PROJECT_ID = 'test-project';
    mockWhere.mockResolvedValue([{ id: 'device-1', token: 'fcm-token-1' }]);
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const { sendPushNotification } = await import('./push-notifications');
    const result = await sendPushNotification('user-1', 'Test Title', 'Test Body');

    expect(result).toEqual({ sent: 1, failed: 0 });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://fcm.googleapis.com/v1/projects/test-project/messages:send',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-access-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          message: {
            token: 'fcm-token-1',
            notification: { title: 'Test Title', body: 'Test Body' },
          },
        }),
      })
    );
  });

  it('should deactivate device and count as failed when FCM returns 404', async () => {
    process.env.FCM_PROJECT_ID = 'test-project';
    mockWhere.mockResolvedValue([{ id: 'device-1', token: 'stale-token' }]);
    mockFetch.mockResolvedValue({ ok: false, status: 404 });

    const { sendPushNotification } = await import('./push-notifications');
    const result = await sendPushNotification('user-1', 'Title', 'Body');

    expect(result).toEqual({ sent: 0, failed: 1 });
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith({ isActive: false });
  });

  it('should count as failed when FCM returns 500', async () => {
    process.env.FCM_PROJECT_ID = 'test-project';
    mockWhere.mockResolvedValue([{ id: 'device-1', token: 'fcm-token-1' }]);
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const { sendPushNotification } = await import('./push-notifications');
    const result = await sendPushNotification('user-1', 'Title', 'Body');

    expect(result).toEqual({ sent: 0, failed: 1 });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should count as failed when fetch throws a network error', async () => {
    process.env.FCM_PROJECT_ID = 'test-project';
    mockWhere.mockResolvedValue([{ id: 'device-1', token: 'fcm-token-1' }]);
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { sendPushNotification } = await import('./push-notifications');
    const result = await sendPushNotification('user-1', 'Title', 'Body');

    expect(result).toEqual({ sent: 0, failed: 1 });
  });

  it('should handle multiple devices with mixed results', async () => {
    process.env.FCM_PROJECT_ID = 'test-project';
    mockWhere.mockResolvedValue([
      { id: 'device-1', token: 'good-token' },
      { id: 'device-2', token: 'stale-token' },
      { id: 'device-3', token: 'good-token-2' },
    ]);

    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const { sendPushNotification } = await import('./push-notifications');
    const result = await sendPushNotification('user-1', 'Title', 'Body');

    expect(result).toEqual({ sent: 2, failed: 1 });
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it('should use correct FCM endpoint with project ID', async () => {
    process.env.FCM_PROJECT_ID = 'my-custom-project';
    mockWhere.mockResolvedValue([{ id: 'device-1', token: 'fcm-token' }]);
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const { sendPushNotification } = await import('./push-notifications');
    await sendPushNotification('user-1', 'Title', 'Body');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://fcm.googleapis.com/v1/projects/my-custom-project/messages:send',
      expect.any(Object)
    );
  });

  it('should request firebase.messaging scope from GoogleAuth', async () => {
    process.env.FCM_PROJECT_ID = 'test-project';
    mockWhere.mockResolvedValue([{ id: 'device-1', token: 'fcm-token' }]);
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const { sendPushNotification } = await import('./push-notifications');
    await sendPushNotification('user-1', 'Title', 'Body');

    expect(MockGoogleAuth).toHaveBeenCalledWith({
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });
  });

  it('should not deactivate device on non-404 errors', async () => {
    process.env.FCM_PROJECT_ID = 'test-project';
    mockWhere.mockResolvedValue([{ id: 'device-1', token: 'fcm-token' }]);
    mockFetch.mockResolvedValue({ ok: false, status: 403 });

    const { sendPushNotification } = await import('./push-notifications');
    const result = await sendPushNotification('user-1', 'Title', 'Body');

    expect(result).toEqual({ sent: 0, failed: 1 });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should handle multiple devices all failing', async () => {
    process.env.FCM_PROJECT_ID = 'test-project';
    mockWhere.mockResolvedValue([
      { id: 'device-1', token: 'bad-token-1' },
      { id: 'device-2', token: 'bad-token-2' },
    ]);

    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: false, status: 500 });

    const { sendPushNotification } = await import('./push-notifications');
    const result = await sendPushNotification('user-1', 'Title', 'Body');

    expect(result).toEqual({ sent: 0, failed: 2 });
  });

  it('should handle multiple devices all succeeding', async () => {
    process.env.FCM_PROJECT_ID = 'test-project';
    mockWhere.mockResolvedValue([
      { id: 'device-1', token: 'good-1' },
      { id: 'device-2', token: 'good-2' },
      { id: 'device-3', token: 'good-3' },
    ]);

    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const { sendPushNotification } = await import('./push-notifications');
    const result = await sendPushNotification('user-1', 'Title', 'Body');

    expect(result).toEqual({ sent: 3, failed: 0 });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
