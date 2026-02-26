import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockSelect, mockInsert, mockUpdate, mockDelete, mockRateLimit } =
  vi.hoisted(() => {
    // Select chain: .select().from().where().orderBy() or .select().from().where()
    const mockOrderBy = vi.fn();
    const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy }));
    const mockFrom = vi.fn(() => ({ where: mockWhere }));
    const mockSelect = vi.fn(() => ({ from: mockFrom }));

    // Insert chain: .insert().values().returning()
    const mockReturning = vi.fn();
    const mockValues = vi.fn(() => ({ returning: mockReturning }));
    const mockInsert = vi.fn(() => ({ values: mockValues }));

    // Update chain: .update().set().where()
    const mockUpdateWhere = vi.fn();
    const mockSet = vi.fn(() => ({ where: mockUpdateWhere }));
    const mockUpdate = vi.fn(() => ({ set: mockSet }));

    // Delete chain: .delete().where()
    const mockDeleteWhere = vi.fn();
    const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));

    const mockAuth = vi.fn();
    const mockRateLimit = vi.fn();

    Object.assign(mockSelect, { from: mockFrom, where: mockWhere, orderBy: mockOrderBy });
    Object.assign(mockInsert, { values: mockValues, returning: mockReturning });
    Object.assign(mockUpdate, { set: mockSet, where: mockUpdateWhere });
    Object.assign(mockDelete, { where: mockDeleteWhere });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {
      mockAuth,
      mockSelect: mockSelect as any,
      mockInsert: mockInsert as any,
      mockUpdate: mockUpdate as any,
      mockDelete: mockDelete as any,
      mockRateLimit,
    };
  });

vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    select: (...args: any[]) => mockSelect(...args),
    insert: (...args: any[]) => mockInsert(...args),
    update: (...args: any[]) => mockUpdate(...args),
    delete: (...args: any[]) => mockDelete(...args),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  webhookConfigs: {
    id: 'id',
    userId: 'userId',
    type: 'type',
    name: 'name',
    isActive: 'isActive',
    secret: 'secret',
    config: 'config',
    lastReceivedAt: 'lastReceivedAt',
    totalReceived: 'totalReceived',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  checkServerActionRateLimit: (...args: unknown[]) => mockRateLimit(...args),
  RATE_LIMITS: { serverAction: { maxRequests: 30, windowMs: 60000 } },
}));

vi.mock('drizzle-orm', () => ({
  eq: (...args: unknown[]) => args,
  and: (...args: unknown[]) => args,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/validations', async () => {
  const { z } = await import('zod');
  return {
    createWebhookConfigSchema: z.object({
      type: z.enum(['generic', 'slack', 'discord']),
      name: z.string().min(1, 'Name is required').max(100),
      secret: z.string().optional(),
      config: z
        .object({
          channels: z.array(z.string()).optional(),
          defaultTags: z.array(z.string()).optional(),
          contentType: z.enum(['note', 'link']).optional(),
        })
        .optional(),
    }),
  };
});

import {
  getWebhookConfigsAction,
  createWebhookConfigAction,
  updateWebhookConfigAction,
  deleteWebhookConfigAction,
} from './webhooks';

// --- helpers ---

const sampleWebhookConfig = {
  id: 'wh-1',
  userId: 'user-1',
  type: 'generic',
  name: 'My Webhook',
  isActive: true,
  secret: 'secret-123',
  config: { defaultTags: ['imported'] },
  lastReceivedAt: null,
  totalReceived: 0,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

function setupSelectChain(rows: unknown[]) {
  const mockOrderByFn = vi.fn().mockResolvedValue(rows);
  const whereResult = {
    orderBy: mockOrderByFn,
    then: (resolve: (v: unknown) => void) => Promise.resolve(rows).then(resolve),
  };
  const mockWhereFn = vi.fn(() => whereResult);
  const mockFromFn = vi.fn(() => ({ where: mockWhereFn }));
  mockSelect.mockReturnValue({ from: mockFromFn });
}

function setupInsertChain(rows: unknown[]) {
  const mockReturningFn = vi.fn().mockResolvedValue(rows);
  const mockValuesFn = vi.fn(() => ({ returning: mockReturningFn }));
  mockInsert.mockReturnValue({ values: mockValuesFn });
}

function setupUpdateChain() {
  const mockUpdateWhereFn = vi.fn().mockResolvedValue(undefined);
  const mockSetFn = vi.fn(() => ({ where: mockUpdateWhereFn }));
  mockUpdate.mockReturnValue({ set: mockSetFn });
}

function setupDeleteChain() {
  const mockDeleteWhereFn = vi.fn().mockResolvedValue(undefined);
  mockDelete.mockReturnValue({ where: mockDeleteWhereFn });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  mockRateLimit.mockReturnValue({ success: true });
  setupSelectChain([]);
  setupInsertChain([sampleWebhookConfig]);
  setupUpdateChain();
  setupDeleteChain();
});

// ============================
// getWebhookConfigsAction
// ============================

describe('getWebhookConfigsAction', () => {
  it('returns configs for authenticated user', async () => {
    setupSelectChain([sampleWebhookConfig]);

    const result = await getWebhookConfigsAction();
    expect(result.success).toBe(true);
    expect(result.configs).toHaveLength(1);
    expect(result.configs[0].id).toBe('wh-1');
    expect(result.configs[0].name).toBe('My Webhook');
    expect(result.configs[0].type).toBe('generic');
  });

  it('returns unauthorized for unauthenticated user', async () => {
    mockAuth.mockResolvedValue(null);

    const result = await getWebhookConfigsAction();
    expect(result.success).toBe(false);
    expect(result.configs).toEqual([]);
    expect(result.message).toBe('Unauthorized');
  });

  it('returns empty configs array when user has no webhooks', async () => {
    setupSelectChain([]);

    const result = await getWebhookConfigsAction();
    expect(result.success).toBe(true);
    expect(result.configs).toEqual([]);
  });

  it('returns failure on database error', async () => {
    const mockOrderByFn = vi.fn().mockRejectedValue(new Error('DB failure'));
    const mockWhereFn = vi.fn(() => ({ orderBy: mockOrderByFn }));
    const mockFromFn = vi.fn(() => ({ where: mockWhereFn }));
    mockSelect.mockReturnValue({ from: mockFromFn });

    const result = await getWebhookConfigsAction();
    expect(result.success).toBe(false);
    expect(result.configs).toEqual([]);
    expect(result.message).toBe('Failed to fetch webhook configs');
  });
});

// ============================
// createWebhookConfigAction
// ============================

describe('createWebhookConfigAction', () => {
  it('creates webhook successfully', async () => {
    setupInsertChain([sampleWebhookConfig]);

    const result = await createWebhookConfigAction({
      type: 'generic',
      name: 'My Webhook',
      secret: 'secret-123',
      config: { defaultTags: ['imported'] },
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Webhook created successfully');
    expect(result.config).toBeDefined();
    expect(result.config!.id).toBe('wh-1');
    expect(result.config!.name).toBe('My Webhook');
  });

  it('returns unauthorized for unauthenticated user', async () => {
    mockAuth.mockResolvedValue(null);

    const result = await createWebhookConfigAction({
      type: 'generic',
      name: 'My Webhook',
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized');
  });

  it('validates input - rejects empty name', async () => {
    const result = await createWebhookConfigAction({
      type: 'generic',
      name: '',
    });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Name is required/);
  });

  it('validates input - rejects invalid type', async () => {
    const result = await createWebhookConfigAction({
      type: 'invalid' as any,
      name: 'My Webhook',
    });

    expect(result.success).toBe(false);
  });

  it('returns failure when rate limited', async () => {
    mockRateLimit.mockReturnValue({
      success: false,
      message: 'Rate limit exceeded. Please try again in 30 seconds.',
    });

    const result = await createWebhookConfigAction({
      type: 'generic',
      name: 'My Webhook',
    });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/rate/i);
  });

  it('creates webhook without optional fields', async () => {
    setupInsertChain([{ ...sampleWebhookConfig, secret: null, config: null }]);

    const result = await createWebhookConfigAction({
      type: 'slack',
      name: 'Slack Webhook',
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Webhook created successfully');
  });

  it('returns failure on database error during insert', async () => {
    const mockReturningFn = vi.fn().mockRejectedValue(new Error('Insert failed'));
    const mockValuesFn = vi.fn(() => ({ returning: mockReturningFn }));
    mockInsert.mockReturnValue({ values: mockValuesFn });

    const result = await createWebhookConfigAction({
      type: 'generic',
      name: 'My Webhook',
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to create webhook config');
  });
});

// ============================
// updateWebhookConfigAction
// ============================

describe('updateWebhookConfigAction', () => {
  it('updates webhook successfully', async () => {
    // First select finds the existing webhook
    setupSelectChain([{ id: 'wh-1' }]);
    setupUpdateChain();

    const result = await updateWebhookConfigAction('wh-1', { name: 'Updated Webhook' });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Webhook updated successfully');
  });

  it('returns unauthorized for unauthenticated user', async () => {
    mockAuth.mockResolvedValue(null);

    const result = await updateWebhookConfigAction('wh-1', { name: 'Updated' });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized');
  });

  it('returns failure when rate limited', async () => {
    mockRateLimit.mockReturnValue({
      success: false,
      message: 'Rate limit exceeded. Please try again in 30 seconds.',
    });

    const result = await updateWebhookConfigAction('wh-1', { name: 'Updated' });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/rate/i);
  });

  it('returns not found when webhook does not exist', async () => {
    // Select returns empty - webhook not found for this user
    const mockWhereFn = vi.fn().mockResolvedValue([]);
    const mockFromFn = vi.fn(() => ({ where: mockWhereFn }));
    mockSelect.mockReturnValue({ from: mockFromFn });

    const result = await updateWebhookConfigAction('nonexistent-id', { name: 'Updated' });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Webhook not found');
  });

  it('updates isActive field', async () => {
    setupSelectChain([{ id: 'wh-1' }]);
    const mockUpdateWhereFn = vi.fn().mockResolvedValue(undefined);
    const mockSetFn = vi.fn(() => ({ where: mockUpdateWhereFn }));
    mockUpdate.mockReturnValue({ set: mockSetFn });

    const result = await updateWebhookConfigAction('wh-1', { isActive: false });

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
    const setArg = (mockSetFn.mock.calls as unknown[][])[0][0] as Record<string, unknown>;
    expect(setArg.isActive).toBe(false);
    expect(setArg.updatedAt).toBeInstanceOf(Date);
  });

  it('returns failure on database error during update', async () => {
    setupSelectChain([{ id: 'wh-1' }]);
    const mockUpdateWhereFn = vi.fn().mockRejectedValue(new Error('Update failed'));
    const mockSetFn = vi.fn(() => ({ where: mockUpdateWhereFn }));
    mockUpdate.mockReturnValue({ set: mockSetFn });

    const result = await updateWebhookConfigAction('wh-1', { name: 'Updated' });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to update webhook config');
  });
});

// ============================
// deleteWebhookConfigAction
// ============================

describe('deleteWebhookConfigAction', () => {
  it('deletes webhook successfully', async () => {
    // Select finds the webhook
    setupSelectChain([{ id: 'wh-1' }]);
    setupDeleteChain();

    const result = await deleteWebhookConfigAction('wh-1');

    expect(result.success).toBe(true);
    expect(result.message).toBe('Webhook deleted successfully');
  });

  it('returns unauthorized for unauthenticated user', async () => {
    mockAuth.mockResolvedValue(null);

    const result = await deleteWebhookConfigAction('wh-1');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized');
  });

  it('returns failure when rate limited', async () => {
    mockRateLimit.mockReturnValue({
      success: false,
      message: 'Rate limit exceeded. Please try again in 30 seconds.',
    });

    const result = await deleteWebhookConfigAction('wh-1');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/rate/i);
  });

  it('returns not found when webhook does not exist', async () => {
    const mockWhereFn = vi.fn().mockResolvedValue([]);
    const mockFromFn = vi.fn(() => ({ where: mockWhereFn }));
    mockSelect.mockReturnValue({ from: mockFromFn });

    const result = await deleteWebhookConfigAction('nonexistent-id');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Webhook not found');
  });

  it('calls db.delete when webhook is found', async () => {
    setupSelectChain([{ id: 'wh-1' }]);
    setupDeleteChain();

    await deleteWebhookConfigAction('wh-1');

    expect(mockDelete).toHaveBeenCalled();
  });

  it('returns failure on database error during delete', async () => {
    setupSelectChain([{ id: 'wh-1' }]);
    const mockDeleteWhereFn = vi.fn().mockRejectedValue(new Error('Delete failed'));
    mockDelete.mockReturnValue({ where: mockDeleteWhereFn });

    const result = await deleteWebhookConfigAction('wh-1');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to delete webhook config');
  });
});
