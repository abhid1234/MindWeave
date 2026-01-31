import { z } from 'zod';

/**
 * Content creation validation schema
 */
export const createContentSchema = z.object({
  type: z.enum(['note', 'link', 'file']),
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  body: z.string().max(50000, 'Content is too long').optional(),
  url: z.string().optional().or(z.literal('')),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
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
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
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
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
  tags: z.array(z.string()).default([]),
  type: z.enum(['note', 'link']),
  createdAt: z.coerce.date().optional(),
  metadata: z.record(z.any()).optional(),
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
