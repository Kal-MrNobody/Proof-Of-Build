import { NextResponse } from 'next/server';
import { insertVerification } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { repoUrl, deployUrl } = await req.json();

    if (!repoUrl) {
      return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 });
    }

    // --- 1. Automated Code & Contribution Analysis (Mock Heuristic) ---
    // In a production app, we would use the GitHub API via Octokit here.
    // For now, we simulate a complexity heuristic.
    const complexityScore = Math.floor(Math.random() * (100 - 50 + 1) + 50); // Score between 50 and 100
    const mockLanguages = ['TypeScript', 'Python', 'React', 'Go'];
    const selectedLangs = mockLanguages.sort(() => 0.5 - Math.random()).slice(0, 2).join(', ');

    // --- 2. Live Deployment Verification ---
    let deploymentStatus = 'None';
    if (deployUrl) {
      try {
        const response = await fetch(deployUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          deploymentStatus = 'Active (200 OK)';
        } else {
          deploymentStatus = \`Error (\${response.status})\`;
        }
      } catch (e) {
        deploymentStatus = 'Unreachable';
      }
    }

    // --- 3. Update Dynamic Proof Ledger ---
    const verificationData = {
      repo_url: repoUrl,
      deploy_url: deployUrl || '',
      complexity_score: complexityScore,
      languages: selectedLangs,
      deployment_status: deploymentStatus,
    };

    insertVerification(verificationData);

    return NextResponse.json({ success: true, data: verificationData });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
