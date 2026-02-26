import { z } from 'zod';

/**
 * SECURITY: Validate that a URL does not point to private/internal networks (SSRF prevention)
 */
function isPrivateUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    // Block localhost variants
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0') {
      return true;
    }

    // Block private IP ranges (RFC 1918 + link-local)
    if (
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    ) {
      return true;
    }

    // Block metadata endpoints (cloud provider)
    if (hostname === 'metadata.google.internal' || hostname === '169.254.169.254') {
      return true;
    }

    // Block file:// and other dangerous protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return true;
    }

    return false;
  } catch {
    return true; // Invalid URL = reject
  }
}

/**
 * Content creation validation schema
 */
export const createContentSchema = z.object({
  type: z.enum(['note', 'link', 'file']),
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  body: z.string().max(50000, 'Content is too long').optional(),
  url: z.string().optional().or(z.literal('')),
  tags: z.array(z.string()).default([]),
  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(2000), z.number(), z.boolean(), z.null()])
  ).optional(),
}).superRefine((data, ctx) => {
  // Only validate URL format for link type
  if (data.type === 'link' && data.url && data.url !== '') {
    try {
      new URL(data.url);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid URL',
        path: ['url'],
      });
      return;
    }
    // SECURITY: Reject private/internal network URLs (SSRF prevention)
    if (isPrivateUrl(data.url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'URLs pointing to private networks are not allowed',
        path: ['url'],
      });
    }
  }
});

export type CreateContentInput = z.infer<typeof createContentSchema>;

/**
 * Content update validation schema
 */
export const updateContentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long').optional(),
  body: z.string().max(50000, 'Content is too long').optional(),
  url: z.string().url('Invalid URL')
    .refine(url => !isPrivateUrl(url), 'URLs pointing to private networks are not allowed')
    .optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(2000), z.number(), z.boolean(), z.null()])
  ).optional(),
});

export type UpdateContentInput = z.infer<typeof updateContentSchema>;

/**
 * Search query validation schema
 */
export const searchQuerySchema = z.object({
  query: z.string().min(1, 'Query is required').max(200, 'Query is too long'),
  type: z.enum(['note', 'link', 'file']).optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).default(20),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

/**
 * Tag creation validation schema
 */
export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, 'Tag name is required')
    .max(50, 'Tag name is too long')
    .regex(/^[a-z0-9-_\s]+$/, 'Tag must contain only lowercase letters, numbers, hyphens, and underscores'),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;

/**
 * Question/Answer validation schema
 */
export const questionSchema = z.object({
  question: z.string().min(1, 'Question is required').max(500, 'Question is too long'),
  contextLimit: z.number().min(1).max(20).default(5),
});

export type QuestionInput = z.infer<typeof questionSchema>;

/**
 * Import source schema
 */
export const importSourceSchema = z.enum(['bookmarks', 'pocket', 'notion', 'evernote']);

export type ImportSourceType = z.infer<typeof importSourceSchema>;

/**
 * Import item schema
 */
export const importItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  body: z.string().max(50000, 'Content is too long').optional(),
  url: z.string().url('Invalid URL')
    .refine(url => !isPrivateUrl(url), 'URLs pointing to private networks are not allowed')
    .optional().or(z.literal('')),
  tags: z.array(z.string()).default([]),
  type: z.enum(['note', 'link']),
  createdAt: z.coerce.date().optional(),
  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(2000), z.number(), z.boolean(), z.null()])
  ).optional(),
});

export type ImportItemInput = z.infer<typeof importItemSchema>;

/**
 * Import options schema
 */
export const importOptionsSchema = z.object({
  skipDuplicates: z.boolean().default(true),
  generateAutoTags: z.boolean().default(true),
  generateEmbeddings: z.boolean().default(true),
  additionalTags: z.array(z.string()).default([]),
});

export type ImportOptionsInput = z.infer<typeof importOptionsSchema>;

/**
 * Bulk import schema
 */
export const bulkImportSchema = z.object({
  items: z.array(importItemSchema).min(1, 'At least one item is required').max(1000, 'Too many items'),
  options: importOptionsSchema.optional(),
});

export type BulkImportInput = z.infer<typeof bulkImportSchema>;

/**
 * Onboarding step validation schema
 */
export const onboardingStepSchema = z.object({
  step: z.number().min(0).max(4),
});

export type OnboardingStepInput = z.infer<typeof onboardingStepSchema>;

/**
 * Password validation schema
 * Requires: min 8 chars, max 128, at least one uppercase, one lowercase, one number
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Profile update validation schema
 */
export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-z0-9_-]+$/, 'Username must contain only lowercase letters, numbers, hyphens, and underscores')
    .optional()
    .nullable(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional().nullable(),
  isProfilePublic: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Task creation validation schema
 */
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.coerce.date().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

/**
 * Task update validation schema
 */
export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.coerce.date().optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

/**
 * Task query validation schema
 */
export const taskQuerySchema = z.object({
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  sort: z.enum(['createdAt', 'dueDate', 'priority', 'title']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
});

export type TaskQueryInput = z.infer<typeof taskQuerySchema>;

/**
 * Post generation validation schema
 */
export const generatePostSchema = z.object({
  contentIds: z
    .array(z.string().uuid('Invalid content ID'))
    .min(1, 'Select at least one content item')
    .max(5, 'Maximum 5 content items allowed'),
  tone: z.enum(['professional', 'casual', 'storytelling']),
  length: z.enum(['short', 'medium', 'long']),
  includeHashtags: z.boolean().default(true),
});

export type GeneratePostInput = z.infer<typeof generatePostSchema>;

/**
 * Reminder validation schemas
 */
export const setReminderSchema = z.object({
  contentId: z.string().uuid('Invalid content ID'),
  interval: z.enum(['1d', '3d', '7d', '30d']),
});

export type SetReminderInput = z.infer<typeof setReminderSchema>;

export const snoozeReminderSchema = z.object({
  reminderId: z.string().uuid('Invalid reminder ID'),
  duration: z.enum(['1d', '3d', '7d']),
});

export type SnoozeReminderInput = z.infer<typeof snoozeReminderSchema>;

/**
 * Collection sharing validation schemas
 */
export const inviteToCollectionSchema = z.object({
  collectionId: z.string().uuid('Invalid collection ID'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['editor', 'viewer']),
});

export type InviteToCollectionInput = z.infer<typeof inviteToCollectionSchema>;

export const updateMemberRoleSchema = z.object({
  collectionId: z.string().uuid('Invalid collection ID'),
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['editor', 'viewer']),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

export const removeMemberSchema = z.object({
  collectionId: z.string().uuid('Invalid collection ID'),
  userId: z.string().uuid('Invalid user ID'),
});

export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;

// Webhook schemas
export const webhookCaptureSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  body: z.string().optional(),
  url: z.string().url('Invalid URL').optional(),
  tags: z.array(z.string()).optional(),
  type: z.enum(['note', 'link', 'file']).optional(),
});

export type WebhookCaptureInput = z.infer<typeof webhookCaptureSchema>;

export const createWebhookConfigSchema = z.object({
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
});

export type CreateWebhookConfigInput = z.infer<typeof createWebhookConfigSchema>;
