export interface ExtractedTxtChunk {
  content: string;
  section: string;
}

export async function parseTxt(buffer: Buffer): Promise<ExtractedTxtChunk[]> {
  try {
    const text = buffer.toString('utf-8');
    if (!text || text.trim().length === 0) {
      return [{ content: 'Empty text document', section: 'Main' }];
    }

    // Split by multiple line breaks or markdown headings if present
    const paragraphs = text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (paragraphs.length <= 1) {
      return [{ content: text.trim(), section: 'Document Body' }];
    }

    // Group small paragraphs together so we don't produce tiny 1-line chunks
    const chunks: ExtractedTxtChunk[] = [];
    let currentBatch: string[] = [];
    let currentChars = 0;
    let sectionCount = 1;

    for (const para of paragraphs) {
      currentBatch.push(para);
      currentChars += para.length;

      if (currentChars >= 800) {
        chunks.push({
          content: currentBatch.join('\n\n'),
          section: `Section ${sectionCount++}`,
        });
        currentBatch = [];
        currentChars = 0;
      }
    }

    if (currentBatch.length > 0) {
      chunks.push({
        content: currentBatch.join('\n\n'),
        section: `Section ${sectionCount}`,
      });
    }

    return chunks;
  } catch (error) {
    console.error('Error in parseTxt:', error);
    throw new Error(`Failed to parse text document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
