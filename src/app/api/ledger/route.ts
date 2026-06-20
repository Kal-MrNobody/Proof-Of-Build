import { NextResponse } from 'next/server';
import { getRecentVerifications } from '@/lib/db';

export async function GET() {
  try {
    const verifications = getRecentVerifications();
    return NextResponse.json({ success: true, data: verifications });
  } catch (error) {
    console.error('Ledger fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
