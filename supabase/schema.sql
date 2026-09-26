-- DocuMind AI - Database Schema for Supabase PostgreSQL with pgvector

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('uploading', 'processing', 'ready', 'error')),
  error_message TEXT,
  chunk_count INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Document Chunks table
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding VECTOR(768), -- Optimized for Gemini text-embedding-004 (768 dimensions)
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- Optional HNSW Vector index for fast approximate nearest neighbor search
-- (Works once enough vectors are populated, threshold can be adjusted)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_document_chunks_embedding_hnsw'
  ) THEN
    BEGIN
      CREATE INDEX idx_document_chunks_embedding_hnsw 
      ON document_chunks 
      USING hnsw (embedding vector_cosine_ops);
    EXCEPTION WHEN OTHERS THEN
      -- If HNSW requires more memory or table is empty during creation, fallback safely
      RAISE NOTICE 'Vector index creation skipped or deferred.';
    END;
  END IF;
END $$;

-- 7. Vector Similarity Search Function
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.2,
  match_count INT DEFAULT 8,
  filter_doc_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE 
    dc.embedding IS NOT NULL
    AND (filter_doc_ids IS NULL OR dc.document_id = ANY(filter_doc_ids))
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
EXCEPTION WHEN OTHERS THEN
  -- Fallback if syntax variation occurs
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE 
    dc.embedding IS NOT NULL
    AND (filter_doc_ids IS NULL OR dc.document_id = ANY(filter_doc_ids))
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
