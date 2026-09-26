import { getSupabaseServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { DocumentRecord, DocumentChunkRecord, ChatMessage, ConversationRecord, ChunkMetadata } from '@/types';

// In-memory / local fallback store for instant zero-config hackathon demo
declare global {
  // eslint-disable-next-line no-var
  var __DOCUMIND_MEMORY_DOCS__: DocumentRecord[] | undefined;
  // eslint-disable-next-line no-var
  var __DOCUMIND_MEMORY_CHUNKS__: DocumentChunkRecord[] | undefined;
  // eslint-disable-next-line no-var
  var __DOCUMIND_MEMORY_CONVOS__: ConversationRecord[] | undefined;
  // eslint-disable-next-line no-var
  var __DOCUMIND_MEMORY_MESSAGES__: ChatMessage[] | undefined;
}

if (!global.__DOCUMIND_MEMORY_DOCS__) {
  global.__DOCUMIND_MEMORY_DOCS__ = [];
}
if (!global.__DOCUMIND_MEMORY_CHUNKS__) {
  global.__DOCUMIND_MEMORY_CHUNKS__ = [];
}
if (!global.__DOCUMIND_MEMORY_CONVOS__) {
  global.__DOCUMIND_MEMORY_CONVOS__ = [];
}
if (!global.__DOCUMIND_MEMORY_MESSAGES__) {
  global.__DOCUMIND_MEMORY_MESSAGES__ = [];
}

const memoryDocs = global.__DOCUMIND_MEMORY_DOCS__;
const memoryChunks = global.__DOCUMIND_MEMORY_CHUNKS__;
const memoryConvos = global.__DOCUMIND_MEMORY_CONVOS__;
const memoryMessages = global.__DOCUMIND_MEMORY_MESSAGES__;

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

export class DocumentRepository {
  static isUsingSupabase(): boolean {
    return isServerSupabaseConfigured;
  }

  static async getDocuments(): Promise<DocumentRecord[]> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data as DocumentRecord[];
        }
      } catch (err) {
        console.warn('Supabase query failed, falling back to local memory:', err);
      }
    }
    return [...memoryDocs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static async getDocumentById(id: string): Promise<DocumentRecord | null> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) {
          return data as DocumentRecord;
        }
      } catch (err) {
        console.warn('Supabase query failed, falling back to local memory:', err);
      }
    }
    return memoryDocs.find(d => d.id === id) || null;
  }

  static async createDocument(doc: Partial<DocumentRecord>): Promise<DocumentRecord> {
    const newDoc: DocumentRecord = {
      id: doc.id || crypto.randomUUID(),
      filename: doc.filename || 'Untitled',
      file_type: doc.file_type || 'txt',
      file_size: doc.file_size || 0,
      storage_path: doc.storage_path || null,
      status: doc.status || 'processing',
      error_message: doc.error_message || null,
      chunk_count: doc.chunk_count || 0,
      metadata: doc.metadata || {},
      created_at: doc.created_at || new Date().toISOString(),
    };

    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('documents')
          .insert(newDoc)
          .select()
          .single();
        if (!error && data) {
          return data as DocumentRecord;
        }
      } catch (err) {
        console.warn('Supabase insert failed, storing in local memory:', err);
      }
    }

    memoryDocs.push(newDoc);
    return newDoc;
  }

  static async updateDocument(id: string, updates: Partial<DocumentRecord>): Promise<DocumentRecord | null> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('documents')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) {
          return data as DocumentRecord;
        }
      } catch (err) {
        console.warn('Supabase update failed, updating in local memory:', err);
      }
    }

    const index = memoryDocs.findIndex(d => d.id === id);
    if (index !== -1) {
      memoryDocs[index] = { ...memoryDocs[index], ...updates };
      return memoryDocs[index];
    }
    return null;
  }

  static async deleteDocument(id: string): Promise<boolean> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase.from('documents').delete().eq('id', id);
        await supabase.from('document_chunks').delete().eq('document_id', id);
      } catch (err) {
        console.warn('Supabase delete failed:', err);
      }
    }

    const docIndex = memoryDocs.findIndex(d => d.id === id);
    if (docIndex !== -1) {
      memoryDocs.splice(docIndex, 1);
    }
    const filteredChunks = memoryChunks.filter(c => c.document_id !== id);
    memoryChunks.length = 0;
    memoryChunks.push(...filteredChunks);
    return true;
  }

  static async insertChunks(chunks: Array<{
    document_id: string;
    content: string;
    metadata: ChunkMetadata;
    embedding?: number[];
  }>): Promise<void> {
    const records: DocumentChunkRecord[] = chunks.map(c => ({
      id: crypto.randomUUID(),
      document_id: c.document_id,
      content: c.content,
      metadata: c.metadata,
      embedding: c.embedding,
      created_at: new Date().toISOString(),
    }));

    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('document_chunks').insert(records);
        if (!error) return;
        console.warn('Supabase chunk insert error, saving to memory:', error);
      } catch (err) {
        console.warn('Supabase chunk insert exception:', err);
      }
    }

    memoryChunks.push(...records);
  }

  static async getChunksByDocumentId(documentId: string): Promise<DocumentChunkRecord[]> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('document_chunks')
          .select('*')
          .eq('document_id', documentId);
        if (!error && data) {
          return data as DocumentChunkRecord[];
        }
      } catch (err) {
        console.warn('Supabase get chunks error:', err);
      }
    }
    return memoryChunks.filter(c => c.document_id === documentId);
  }

  static async searchChunks(
    queryEmbedding?: number[],
    queryText?: string,
    limit = 8,
    filterDocIds?: string[]
  ): Promise<DocumentChunkRecord[]> {
    const supabase = getSupabaseServerClient();

    // 1. Try Supabase pgvector RPC function if vector is provided
    if (supabase && queryEmbedding && queryEmbedding.length > 0) {
      try {
        const { data, error } = await supabase.rpc('match_document_chunks', {
          query_embedding: queryEmbedding,
          match_threshold: 0.15,
          match_count: limit,
          filter_doc_ids: filterDocIds && filterDocIds.length > 0 ? filterDocIds : null,
        });

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            document_id: d.document_id,
            content: d.content,
            metadata: d.metadata,
            similarity: d.similarity,
            created_at: new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn('pgvector search failed or function not yet created:', err);
      }
    }

    // 2. Fallback to vector cosine similarity in memory
    let candidates = memoryChunks;
    if (filterDocIds && filterDocIds.length > 0) {
      candidates = candidates.filter(c => filterDocIds.includes(c.document_id));
    }

    if (queryEmbedding && queryEmbedding.length > 0) {
      const scored = candidates
        .map(chunk => {
          let sim = 0;
          if (chunk.embedding && chunk.embedding.length === queryEmbedding.length) {
            sim = cosineSimilarity(queryEmbedding, chunk.embedding);
          } else if (queryText) {
            // Text keyword overlap fallback
            const qWords = queryText.toLowerCase().split(/\s+/).filter(w => w.length > 2);
            const contentLower = chunk.content.toLowerCase();
            const matches = qWords.filter(w => contentLower.includes(w)).length;
            sim = matches > 0 ? matches / qWords.length * 0.7 : 0.05;
          }
          return { ...chunk, similarity: sim };
        })
        .sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

      return scored.slice(0, limit);
    }

    // 3. Keyword-based matching fallback
    if (queryText) {
      const qWords = queryText.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const scored = candidates
        .map(chunk => {
          const contentLower = chunk.content.toLowerCase();
          const matches = qWords.filter(w => contentLower.includes(w)).length;
          const score = matches > 0 ? matches / Math.max(qWords.length, 1) : 0.05;
          return { ...chunk, similarity: score };
        })
        .sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

      return scored.slice(0, limit);
    }

    return candidates.slice(0, limit);
  }

  static async clearAll(): Promise<void> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('conversations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('document_chunks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.warn('Failed clearing Supabase:', err);
      }
    }
    memoryDocs.length = 0;
    memoryChunks.length = 0;
    memoryConvos.length = 0;
    memoryMessages.length = 0;
  }
}
