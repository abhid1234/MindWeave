export interface TagGenerationResult {
  tags: string[];
  confidence?: number;
}

export interface QuestionAnswerResult {
  answer: string;
  sources: Array<{
    id: string;
    title: string;
    relevance: number;
  }>;
}

export interface SimilaritySearchResult {
  id: string;
  title: string;
  body?: string;
  tags: string[];
  similarity: number;
}

export interface EmbeddingMetadata {
  model: string;
  dimensions: number;
  createdAt: Date;
}
