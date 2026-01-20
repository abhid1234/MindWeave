-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create initial schema
-- Tables will be created by Drizzle migrations, but we enable the extension here
