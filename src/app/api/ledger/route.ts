import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const verifications = await prisma.verificationRun.findMany({
      orderBy: { verifiedAt: 'desc' },
      take: 10,
      include: {
        repo: {
          include: { user: true }
        },
        deploymentCheck: true
      }
    });
    return NextResponse.json({ success: true, data: verifications });
  } catch (error: any) {
    console.error('Ledger fetch error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
