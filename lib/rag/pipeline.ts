import { DocumentRepository } from '@/lib/db/repository';
import { generateEmbedding } from '@/lib/embeddings/embedder';
import { generateGroundedAnswer, LLMResponse } from '@/lib/ai/llm';
import { DocumentChunkRecord, ChatMessage } from '@/types';

export interface RagQueryResult extends LLMResponse {
  retrievedCount: number;
  sourcesCount: number;
  documentsQueried: string[];
}

export async function executeRagPipeline(
  question: string,
  options: {
    filterDocIds?: string[];
    maxChunks?: number;
    conversationHistory?: ChatMessage[];
  } = {}
): Promise<RagQueryResult> {
  const { filterDocIds, maxChunks = 8, conversationHistory = [] } = options;
  const trimmedQuestion = question.trim();

  if (!trimmedQuestion) {
    return {
      answer: 'Please enter a valid question.',
      citations: [],
      retrievedCount: 0,
      sourcesCount: 0,
      documentsQueried: [],
    };
  }

  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(trimmedQuestion);

  // 2. Vector similarity search across database / vector store
  const candidateChunks = await DocumentRepository.searchChunks(
    queryEmbedding,
    trimmedQuestion,
    maxChunks * 2, // Fetch double to perform multi-source balance re-ranking
    filterDocIds
  );

  if (candidateChunks.length === 0) {
    return {
      answer: "I couldn't find enough information in the uploaded documents to answer that confidently. Please upload documents related to this topic.",
      citations: [],
      retrievedCount: 0,
      sourcesCount: 0,
      documentsQueried: [],
    };
  }

  // 3. Multi-Document Diversity Re-ranking:
  // Prevent a single document from crowding out other relevant sources
  const balancedChunks = balanceChunksAcrossDocuments(candidateChunks, maxChunks);

  // 4. Generate grounded LLM answer with inline citations
  const llmResult = await generateGroundedAnswer(
    trimmedQuestion,
    balancedChunks,
    conversationHistory
  );

  const uniqueDocs = Array.from(
    new Set(balancedChunks.map(c => c.metadata?.filename).filter(Boolean))
  );

  return {
    answer: llmResult.answer,
    citations: llmResult.citations,
    retrievedCount: balancedChunks.length,
    sourcesCount: uniqueDocs.length,
    documentsQueried: uniqueDocs as string[],
  };
}

/**
 * Balances top candidates across different documents to promote multi-source reasoning.
 */
function balanceChunksAcrossDocuments(
  chunks: DocumentChunkRecord[],
  targetCount: number
): DocumentChunkRecord[] {
  const byDoc: Record<string, DocumentChunkRecord[]> = {};

  for (const chunk of chunks) {
    const docId = chunk.document_id || 'unknown';
    if (!byDoc[docId]) {
      byDoc[docId] = [];
    }
    byDoc[docId].push(chunk);
  }

  const selected: DocumentChunkRecord[] = [];
  const docIds = Object.keys(byDoc);

  // Round-robin pick from each document to ensure multi-source coverage
  let round = 0;
  while (selected.length < targetCount) {
    let addedThisRound = false;
    for (const docId of docIds) {
      if (byDoc[docId][round]) {
        selected.push(byDoc[docId][round]);
        addedThisRound = true;
        if (selected.length >= targetCount) break;
      }
    }
    if (!addedThisRound) break;
    round++;
  }

  // Sort final selected by similarity score descending
  return selected.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
}
