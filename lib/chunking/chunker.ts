import { ChunkMetadata } from '@/types';

export interface FinalChunk {
  content: string;
  metadata: ChunkMetadata;
}

export function chunkDocument(
  extractedChunks: Array<{
    content: string;
    metadata: Omit<ChunkMetadata, 'chunkIndex'>;
  }>,
  maxWordsPerChunk = 450,
  overlapWords = 50
): FinalChunk[] {
  const result: FinalChunk[] = [];
  let globalChunkIndex = 0;

  for (const item of extractedChunks) {
    const rawContent = item.content.trim();
    if (!rawContent) continue;

    // For spreadsheet chunks, don't break table rows indiscriminately
    if (item.metadata.fileType === 'xlsx' || item.metadata.fileType === 'csv') {
      const meta: ChunkMetadata = {
        filename: item.metadata.filename,
        fileType: item.metadata.fileType,
        page: item.metadata.page,
        totalPages: item.metadata.totalPages,
        sheet: item.metadata.sheet,
        rows: item.metadata.rows,
        section: item.metadata.section,
        chunkIndex: globalChunkIndex++,
        tokenEstimate: Math.round(rawContent.length / 4),
      };
      result.push({
        content: rawContent,
        metadata: meta,
      });
      continue;
    }

    const words = rawContent.split(/\s+/);
    if (words.length <= maxWordsPerChunk) {
      const meta: ChunkMetadata = {
        filename: item.metadata.filename,
        fileType: item.metadata.fileType,
        page: item.metadata.page,
        totalPages: item.metadata.totalPages,
        sheet: item.metadata.sheet,
        rows: item.metadata.rows,
        section: item.metadata.section,
        chunkIndex: globalChunkIndex++,
        tokenEstimate: Math.round(rawContent.length / 4),
      };
      result.push({
        content: rawContent,
        metadata: meta,
      });
      continue;
    }

    // Split long document sections with sliding window and sentence boundary preference
    let start = 0;
    while (start < words.length) {
      const end = Math.min(start + maxWordsPerChunk, words.length);
      const chunkWords = words.slice(start, end);
      const chunkText = chunkWords.join(' ');

      const meta: ChunkMetadata = {
        filename: item.metadata.filename,
        fileType: item.metadata.fileType,
        page: item.metadata.page,
        totalPages: item.metadata.totalPages,
        sheet: item.metadata.sheet,
        rows: item.metadata.rows,
        section: item.metadata.section,
        chunkIndex: globalChunkIndex++,
        tokenEstimate: Math.round(chunkText.length / 4),
      };

      result.push({
        content: chunkText,
        metadata: meta,
      });

      if (end >= words.length) break;
      start += maxWordsPerChunk - overlapWords;
    }
  }

  return result;
}
