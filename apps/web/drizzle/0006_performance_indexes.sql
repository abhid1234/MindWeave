-- Add summary column to content table for AI-generated summaries
ALTER TABLE "content" ADD COLUMN IF NOT EXISTS "summary" varchar(500);

--> statement-breakpoint

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "content_user_created_at_idx" ON "content" USING btree ("user_id", "created_at" DESC);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "content_user_type_idx" ON "content" USING btree ("user_id", "type");

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "content_user_favorite_idx" ON "content" USING btree ("user_id", "is_favorite");

--> statement-breakpoint

-- GIN indexes for array containment queries on tags
CREATE INDEX IF NOT EXISTS "content_tags_gin_idx" ON "content" USING gin ("tags");

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "content_auto_tags_gin_idx" ON "content" USING gin ("auto_tags");

--> statement-breakpoint

-- HNSW index for faster vector similarity search on embeddings
-- Note: This requires pgvector extension with HNSW support (pgvector >= 0.5.0)
-- The index improves approximate nearest neighbor search performance
CREATE INDEX IF NOT EXISTS "embeddings_hnsw_idx" ON "embeddings"
  USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
