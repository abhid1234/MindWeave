export interface TilPostWithDetails {
  id: string;
  contentId: string;
  title: string;
  body: string | null;
  tags: string[];
  upvoteCount: number;
  viewCount: number;
  publishedAt: Date;
  creator: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  hasUpvoted: boolean;
  shareId: string | null;
}

export interface BrowseTilParams {
  query?: string;
  tag?: string;
  sort?: 'trending' | 'newest' | 'most-upvoted';
  page?: number;
  perPage?: number;
}

export interface BrowseTilResult {
  success: boolean;
  posts: TilPostWithDetails[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  popularTags: string[];
  message?: string;
}

export interface TilActionResult {
  success: boolean;
  message: string;
  tilId?: string;
}

export interface TilDetailResult {
  success: boolean;
  post?: TilPostWithDetails;
  message?: string;
}
