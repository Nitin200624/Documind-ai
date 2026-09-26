import { PDFParse } from 'pdf-parse';

export interface ExtractedPageChunk {
  content: string;
  page: number;
  totalPages: number;
}

export async function parsePdf(buffer: Buffer): Promise<ExtractedPageChunk[]> {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const totalPages = result.total || result.pages?.length || 1;

    const pages: ExtractedPageChunk[] = [];

    if (result.pages && Array.isArray(result.pages)) {
      for (const p of result.pages) {
        const text = (p.text || '').trim();
        if (text.length > 0) {
          pages.push({
            content: text,
            page: p.num || pages.length + 1,
            totalPages,
          });
        }
      }
    }

    await parser.destroy();

    if (pages.length === 0) {
      const fullText = (result.text || '').trim();
      if (fullText.length > 0) {
        return [
          {
            content: fullText,
            page: 1,
            totalPages,
          },
        ];
      }
      return [
        {
          content: 'No readable text layer found in PDF.',
          page: 1,
          totalPages: 1,
        },
      ];
    }

    return pages;
  } catch (error) {
    console.error('Error in parsePdf:', error);
    throw new Error(`Failed to parse PDF document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
