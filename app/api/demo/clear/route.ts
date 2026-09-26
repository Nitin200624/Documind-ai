import { NextResponse } from 'next/server';
import { DocumentRepository } from '@/lib/db/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await DocumentRepository.clearAll();
    return NextResponse.json({ success: true, message: 'All documents and memory chunks cleared.' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to clear data' },
      { status: 500 }
    );
  }
}
