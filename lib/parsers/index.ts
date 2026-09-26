import { DocumentType, ParsedDocumentResult, ChunkMetadata } from '@/types';
import { parsePdf } from './pdfParser';
import { parseDocx } from './docxParser';
import { parseSpreadsheet } from './sheetParser';
import { parseTxt } from './txtParser';
import { parseImage } from './imageParser';

export function detectFileType(filename: string, mimeType?: string): DocumentType {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (ext === 'pdf' || mimeType?.includes('pdf')) return 'pdf';
  if (['docx', 'doc'].includes(ext) || mimeType?.includes('wordprocessingml')) return 'docx';
  if (['xlsx', 'xls'].includes(ext) || mimeType?.includes('spreadsheetml') || mimeType?.includes('excel')) return 'xlsx';
  if (ext === 'csv' || mimeType?.includes('csv')) return 'csv';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || mimeType?.startsWith('image/')) return 'image';
  return 'txt';
}

export async function parseDocument(
  buffer: Buffer,
  filename: string,
  mimeType?: string
): Promise<ParsedDocumentResult> {
  const fileType = detectFileType(filename, mimeType);
  const fileSize = buffer.length;

  try {
    switch (fileType) {
      case 'pdf': {
        const pages = await parsePdf(buffer);
        const chunks = pages.map(p => ({
          content: p.content,
          metadata: {
            filename,
            fileType,
            page: p.page,
            totalPages: p.totalPages,
          } as Omit<ChunkMetadata, 'chunkIndex'>,
        }));
        return { filename, fileType, fileSize, chunks };
      }

      case 'docx': {
        const sections = await parseDocx(buffer);
        const chunks = sections.map(s => ({
          content: s.content,
          metadata: {
            filename,
            fileType,
            section: s.section,
          } as Omit<ChunkMetadata, 'chunkIndex'>,
        }));
        return { filename, fileType, fileSize, chunks };
      }

      case 'xlsx':
      case 'csv': {
        const sheetChunks = await parseSpreadsheet(buffer, fileType === 'csv');
        const chunks = sheetChunks.map(sc => ({
          content: sc.content,
          metadata: {
            filename,
            fileType,
            sheet: sc.sheet,
            rows: sc.rows,
          } as Omit<ChunkMetadata, 'chunkIndex'>,
        }));
        return { filename, fileType, fileSize, chunks };
      }

      case 'image': {
        const imageChunks = await parseImage(buffer, mimeType);
        const chunks = imageChunks.map(ic => ({
          content: ic.content,
          metadata: {
            filename,
            fileType,
            section: ic.section,
          } as Omit<ChunkMetadata, 'chunkIndex'>,
        }));
        return { filename, fileType, fileSize, chunks };
      }

      case 'txt':
      default: {
        const txtChunks = await parseTxt(buffer);
        const chunks = txtChunks.map(tc => ({
          content: tc.content,
          metadata: {
            filename,
            fileType,
            section: tc.section,
          } as Omit<ChunkMetadata, 'chunkIndex'>,
        }));
        return { filename, fileType, fileSize, chunks };
      }
    }
  } catch (err) {
    console.error(`Error parsing document ${filename}:`, err);
    throw err;
  }
}
