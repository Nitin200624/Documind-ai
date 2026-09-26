import { NextResponse } from 'next/server';
import { seedDemoData } from '@/lib/demo/seedData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await seedDemoData();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Demo seed error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to seed demo data' },
      { status: 500 }
    );
  }
}
