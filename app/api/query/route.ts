import { NextRequest, NextResponse } from 'next/server';
import { executeRagPipeline } from '@/lib/rag/pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, conversationHistory, filterDocIds, maxChunks } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'A question string is required' }, { status: 400 });
    }

    const result = await executeRagPipeline(question, {
      conversationHistory: conversationHistory || [],
      filterDocIds: filterDocIds || undefined,
      maxChunks: maxChunks || 8,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Query endpoint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process question' },
      { status: 500 }
    );
  }
}
