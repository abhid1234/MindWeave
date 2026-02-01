import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockClusterContent } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockClusterContent: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/ai/clustering', () => ({
  clusterContent: (...args: unknown[]) => mockClusterContent(...args),
}));

import { getClustersAction } from './clusters';

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  mockClusterContent.mockResolvedValue([]);
});

describe('getClustersAction', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await getClustersAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized');
    expect(result.clusters).toEqual([]);
  });

  it('returns unauthorized when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });
    const result = await getClustersAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized');
  });

  it('returns clusters on success', async () => {
    const mockClusters = [
      { name: 'JavaScript', description: 'JS content', contentIds: ['1', '2'], size: 2 },
      { name: 'Python', description: 'Python content', contentIds: ['3'], size: 1 },
    ];
    mockClusterContent.mockResolvedValue(mockClusters);

    const result = await getClustersAction();
    expect(result.success).toBe(true);
    expect(result.clusters).toEqual(mockClusters);
    expect(result.message).toBeUndefined();
  });

  it('passes numClusters to clusterContent', async () => {
    mockClusterContent.mockResolvedValue([]);
    await getClustersAction(8);
    expect(mockClusterContent).toHaveBeenCalledWith('user-1', 8);
  });

  it('defaults numClusters to 5', async () => {
    mockClusterContent.mockResolvedValue([]);
    await getClustersAction();
    expect(mockClusterContent).toHaveBeenCalledWith('user-1', 5);
  });

  it('returns failure message on error', async () => {
    mockClusterContent.mockRejectedValue(new Error('AI error'));
    const result = await getClustersAction();
    expect(result.success).toBe(false);
    expect(result.clusters).toEqual([]);
    expect(result.message).toBe('Failed to generate clusters');
  });
});
