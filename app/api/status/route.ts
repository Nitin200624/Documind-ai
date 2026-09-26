import { NextResponse } from 'next/server';
import { DocumentRepository } from '@/lib/db/repository';
import { isServerSupabaseConfigured } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const documents = await DocumentRepository.getDocuments();
    const geminiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || '';
    const openaiKey = process.env.OPENAI_API_KEY || '';

    let aiProvider = 'Built-in Demo Engine';
    if (geminiKey) aiProvider = 'Google Gemini (1.5 Flash & text-embedding-004)';
    else if (openaiKey) aiProvider = 'OpenAI (GPT-4o-mini & text-embedding-3-small)';

    const totalChunks = documents.reduce((sum, d) => sum + (d.chunk_count || 0), 0);

    return NextResponse.json({
      supabaseConnected: isServerSupabaseConfigured,
      aiProvider,
      hasLlmKey: Boolean(geminiKey || openaiKey),
      totalDocuments: documents.length,
      totalChunks,
    });
  } catch (error) {
    return NextResponse.json({
      supabaseConnected: false,
      aiProvider: 'Built-in Demo Engine',
      hasLlmKey: false,
      totalDocuments: 0,
      totalChunks: 0,
    });
  }
}
