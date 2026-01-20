import { type Content, type User, type Embedding } from '@/lib/db/schema';

/**
 * Extended content type with relations
 */
export interface ContentWithRelations extends Content {
  user?: User;
  embeddings?: Embedding[];
}

/**
 * Content filter options
 */
export interface ContentFilters {
  type?: 'note' | 'link' | 'file';
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  perPage: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Sort options
 */
export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: 'createdAt' | 'updatedAt' | 'title';
  order: SortOrder;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * User session type
 */
export interface UserSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires: string;
}
