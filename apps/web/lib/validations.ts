import { z } from 'zod';

/**
 * Content creation validation schema
 */
export const createContentSchema = z.object({
  type: z.enum(['note', 'link', 'file']),
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  body: z.string().max(50000, 'Content is too long').optional(),
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
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
