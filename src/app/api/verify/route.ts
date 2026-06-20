import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { runVerification } from '@/lib/verify';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in with GitHub.' }, { status: 401 });
    }

    const { repoOwner, repoName, deployUrl } = await req.json();

    if (!repoOwner || !repoName) {
      return NextResponse.json({ error: 'Repository owner and name are required' }, { status: 400 });
    }

    // Run the actual verification
    const result = await runVerification(repoOwner, repoName, session.accessToken, deployUrl);

    // Save to Postgres via Prisma
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
       return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upsert Repo
    const repo = await prisma.repo.upsert({
      where: { githubId: result.repoDetails.githubId },
      update: {
        name: result.repoDetails.name,
        fullName: result.repoDetails.fullName,
        url: result.repoDetails.url,
      },
      create: {
        githubId: result.repoDetails.githubId,
        name: result.repoDetails.name,
        fullName: result.repoDetails.fullName,
        url: result.repoDetails.url,
        ownerLogin: result.repoDetails.ownerLogin,
        userId: user.id
      }
    });

    let deploymentCheckRecord = null;
    if (result.deploymentCheck) {
      deploymentCheckRecord = await prisma.deploymentCheck.create({
        data: {
          url: result.deploymentCheck.url,
          status: result.deploymentCheck.status,
          statusCode: result.deploymentCheck.statusCode,
          responseTimeMs: result.deploymentCheck.responseTimeMs,
          hasHSTS: result.deploymentCheck.hasHSTS,
          hasCSP: result.deploymentCheck.hasCSP
        }
      });
    }

    // Create Verification Run
    const verificationRun = await prisma.verificationRun.create({
      data: {
        repoId: repo.id,
        complexityScore: result.complexityScore,
        locTotal: result.locTotal,
        languageStats: result.languageStats,
        contributorCount: result.contributorCount,
        hasTests: result.hasTests,
        hasCI: result.hasCI,
        integrityHash: result.integrityHash,
        deploymentCheckId: deploymentCheckRecord?.id
      },
      include: {
        repo: true,
        deploymentCheck: true
      }
    });

    return NextResponse.json({ success: true, data: verificationRun });
  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
