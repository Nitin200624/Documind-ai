import { NextRequest, NextResponse } from 'next/server';
import { DocumentRepository } from '@/lib/db/repository';
import { parseDocument } from '@/lib/parsers';
import { chunkDocument } from '@/lib/chunking/chunker';
import { generateBatchEmbeddings } from '@/lib/embeddings/embedder';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const processedDocuments = [];

    for (const file of files) {
      const filename = file.name;
      const mimeType = file.type;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 1. Create document entry with 'processing' status
      const doc = await DocumentRepository.createDocument({
        filename,
        file_size: buffer.length,
        status: 'processing',
      });

      try {
        // 2. Parse document according to file format
        const parseResult = await parseDocument(buffer, filename, mimeType);

        // 3. Sensibly chunk document
        const chunks = chunkDocument(parseResult.chunks);

        if (chunks.length === 0) {
          await DocumentRepository.updateDocument(doc.id, {
            status: 'error',
            error_message: 'No readable text or content could be extracted.',
          });
          processedDocuments.push({ ...doc, status: 'error', error: 'No content' });
          continue;
        }

        // 4. Generate vector embeddings for chunks
        const chunkContents = chunks.map(c => c.content);
        const embeddings = await generateBatchEmbeddings(chunkContents);

        // 5. Insert chunks with embeddings and metadata
        const chunksToInsert = chunks.map((c, idx) => ({
          document_id: doc.id,
          content: c.content,
          metadata: c.metadata,
          embedding: embeddings[idx],
        }));

        await DocumentRepository.insertChunks(chunksToInsert);

        // 6. Update document status to ready
        const updatedDoc = await DocumentRepository.updateDocument(doc.id, {
          file_type: parseResult.fileType,
          status: 'ready',
          chunk_count: chunks.length,
          metadata: {
            extractedChunks: chunks.length,
            fileType: parseResult.fileType,
          },
        });

        processedDocuments.push(updatedDoc || doc);
      } catch (procErr) {
        console.error(`Error processing file ${filename}:`, procErr);
        await DocumentRepository.updateDocument(doc.id, {
          status: 'error',
          error_message: procErr instanceof Error ? procErr.message : 'Processing failed',
        });
        processedDocuments.push({
          ...doc,
          status: 'error',
          error_message: procErr instanceof Error ? procErr.message : 'Processing failed',
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: processedDocuments.length,
      documents: processedDocuments,
    });
  } catch (error) {
    console.error('Upload endpoint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
