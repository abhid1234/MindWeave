import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, DELETE, GET } from './route';

// Mock the auth module
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}));

// Mock the db module
vi.mock('@/lib/db/client', () => ({
  db: {
    query: {
      devices: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

import { db } from '@/lib/db/client';

// Helper to create a mock NextRequest
function createMockRequest(body: unknown, method = 'POST'): NextRequest {
  return new NextRequest('http://localhost:3000/api/devices', {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('/api/devices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST - Register device', () => {
    it('should return 401 if not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createMockRequest({
        token: 'test-push-token',
        platform: 'android',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 for missing token', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const request = createMockRequest({
        platform: 'android',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });

    it('should return 400 for invalid platform', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const request = createMockRequest({
        token: 'test-push-token',
        platform: 'windows', // Invalid platform
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });

    it('should create a new device registration', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      vi.mocked(db.query.devices.findFirst).mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'device-123',
              userId: 'user-123',
              token: 'test-push-token',
              platform: 'android',
              isActive: true,
            },
          ]),
        }),
      } as unknown as ReturnType<typeof db.insert>);

      const request = createMockRequest({
        token: 'test-push-token',
        platform: 'android',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('Device registered');
      expect(data.device.id).toBe('device-123');
      expect(data.device.platform).toBe('android');
    });

    it('should update an existing device registration', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      vi.mocked(db.query.devices.findFirst).mockResolvedValue({
        id: 'device-123',
        userId: 'user-123',
        token: 'test-push-token',
        platform: 'ios',
        isActive: false,
        lastUsed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 'device-123',
                userId: 'user-123',
                token: 'test-push-token',
                platform: 'android',
                isActive: true,
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const request = createMockRequest({
        token: 'test-push-token',
        platform: 'android',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Device updated');
      expect(data.device.platform).toBe('android');
    });

    it('should accept all valid platforms', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      vi.mocked(db.query.devices.findFirst).mockResolvedValue(undefined);

      const platforms = ['ios', 'android', 'web'] as const;

      for (const platform of platforms) {
        vi.mocked(db.insert).mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: `device-${platform}`,
                userId: 'user-123',
                token: `token-${platform}`,
                platform,
                isActive: true,
              },
            ]),
          }),
        } as unknown as ReturnType<typeof db.insert>);

        const request = createMockRequest({
          token: `token-${platform}`,
          platform,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.device.platform).toBe(platform);
      }
    });
  });

  describe('DELETE - Unregister device', () => {
    it('should return 401 if not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createMockRequest({ token: 'test-push-token' }, 'DELETE');

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 for missing token', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const request = createMockRequest({}, 'DELETE');

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Token is required');
    });

    it('should return 404 if device not found', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const request = createMockRequest({ token: 'nonexistent-token' }, 'DELETE');

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Device not found');
    });

    it('should soft delete (deactivate) the device', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 'device-123',
                userId: 'user-123',
                token: 'test-push-token',
                platform: 'android',
                isActive: false,
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const request = createMockRequest({ token: 'test-push-token' }, 'DELETE');

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Device unregistered');
    });
  });

  describe('GET - List devices', () => {
    it('should return 401 if not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return empty array when no devices', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      vi.mocked(db.query.devices.findMany).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.devices).toEqual([]);
    });

    it('should return list of active devices', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const mockDevices = [
        {
          id: 'device-1',
          platform: 'android',
          lastUsed: new Date('2024-01-15'),
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'device-2',
          platform: 'ios',
          lastUsed: new Date('2024-01-20'),
          createdAt: new Date('2024-01-10'),
        },
      ];

      vi.mocked(db.query.devices.findMany).mockResolvedValue(mockDevices as never);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.devices).toHaveLength(2);
      expect(data.devices[0].id).toBe('device-1');
      expect(data.devices[1].id).toBe('device-2');
    });

    it('should not include token in response for security', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const mockDevices = [
        {
          id: 'device-1',
          platform: 'android',
          lastUsed: new Date('2024-01-15'),
          createdAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(db.query.devices.findMany).mockResolvedValue(mockDevices as never);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.devices[0]).not.toHaveProperty('token');
      expect(data.devices[0]).not.toHaveProperty('userId');
    });
  });
});
