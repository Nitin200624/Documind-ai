import { NextRequest, NextResponse } from 'next/server';
import { DocumentRepository } from '@/lib/db/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing document id' }, { status: 400 });
    }

    const document = await DocumentRepository.getDocumentById(id);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const chunks = await DocumentRepository.getChunksByDocumentId(id);
    return NextResponse.json({ document, chunks });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve chunks' },
      { status: 500 }
    );
  }
}
