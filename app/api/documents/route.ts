import { NextRequest, NextResponse } from 'next/server';
import { DocumentRepository } from '@/lib/db/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const documents = await DocumentRepository.getDocuments();
    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve documents' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const success = await DocumentRepository.deleteDocument(id);
    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete document' },
      { status: 500 }
    );
  }
}
