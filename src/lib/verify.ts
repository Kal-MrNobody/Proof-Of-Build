import { Octokit } from '@octokit/rest';
import crypto from 'crypto';

export interface VerificationResult {
  repoDetails: {
    githubId: number;
    name: string;
    fullName: string;
    url: string;
    ownerLogin: string;
  };
  complexityScore: number;
  locTotal: number;
  languageStats: string;
  contributorCount: number;
  commitCount: number;
  hasTests: boolean;
  hasCI: boolean;
  deploymentCheck?: {
    url: string;
    status: string;
    statusCode: number | null;
    responseTimeMs: number | null;
    hasHSTS: boolean;
    hasCSP: boolean;
  };
  integrityHash: string;
}

/**
 * Calculates the complexity score based on empirical repository data.
 * 
 * Formula:
 * 1. Base Score = 10
 * 2. LOC points: log10(total_loc) * 10 (e.g., 1000 LOC = 30 points)
 * 3. Contributor points: Math.min(contributor_count * 5, 25)
 * 4. Language diversity points: Math.min(language_count * 5, 15)
 * 5. CI points: +10 if CI config exists
 * 6. Test points: +10 if tests exist
 * Maximum practical score ~100.
 */
export function calculateComplexityScore(
  totalLoc: number,
  contributorCount: number,
  languageCount: number,
  hasCI: boolean,
  hasTests: boolean
): number {
  let score = 10;
  
  if (totalLoc > 0) {
    score += Math.log10(totalLoc) * 10;
  }
  
  score += Math.min(contributorCount * 5, 25);
  score += Math.min(languageCount * 5, 15);
  
  if (hasCI) score += 10;
  if (hasTests) score += 10;
  
  return parseFloat(Math.min(score, 100).toFixed(2));
}

export async function runVerification(
  repoOwner: string, 
  repoName: string, 
  accessToken: string,
  deployUrl?: string
): Promise<VerificationResult> {
  const octokit = new Octokit({ auth: accessToken });
  
  // 1. Fetch Repo Metadata
  const repoRes = await octokit.rest.repos.get({ owner: repoOwner, repo: repoName });
  const repo = repoRes.data;

  // 2. Fetch Languages (LOC approximation)
  const langRes = await octokit.rest.repos.listLanguages({ owner: repoOwner, repo: repoName });
  const languages = langRes.data;
  const locTotal = Object.values(languages).reduce((a, b) => a + b, 0);
  const languageCount = Object.keys(languages).length;
  const languageStats = JSON.stringify(languages);

  // 3. Fetch Contributors
  let contributorCount = 1;
  try {
    const contribRes = await octokit.rest.repos.listContributors({ owner: repoOwner, repo: repoName, per_page: 100 });
    contributorCount = contribRes.data.length;
  } catch (e) {
    console.error('Could not fetch contributors:', e);
  }

  // 4. Heuristic for CI and Tests
  let hasCI = false;
  let hasTests = false;
  try {
    const contentsRes = await octokit.rest.repos.getContent({ owner: repoOwner, repo: repoName, path: '' });
    if (Array.isArray(contentsRes.data)) {
      const files = contentsRes.data.map(f => f.name.toLowerCase());
      hasCI = files.includes('.github') || files.includes('.gitlab-ci.yml') || files.includes('.travis.yml');
      hasTests = files.some(f => f.includes('test') || f.includes('spec') || f.includes('jest'));
    }
  } catch (e) {
    console.error('Could not fetch repo contents:', e);
  }

  // Calculate Score
  const complexityScore = calculateComplexityScore(locTotal, contributorCount, languageCount, hasCI, hasTests);

  // 5. Deployment Verification
  let deploymentCheck = undefined;
  if (deployUrl) {
    const start = Date.now();
    let status = 'Unreachable';
    let statusCode = null;
    let hasHSTS = false;
    let hasCSP = false;
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const res = await fetch(deployUrl, { 
        method: 'HEAD',
        signal: controller.signal as RequestInit["signal"],
        headers: { 'User-Agent': 'ProofOfBuild-Verifier' }
      });
      clearTimeout(timeout);
      
      statusCode = res.status;
      status = res.ok ? 'Verified (200 OK)' : `Error (${statusCode})`;
      
      const hsts = res.headers.get('strict-transport-security');
      const csp = res.headers.get('content-security-policy');
      
      hasHSTS = !!hsts;
      hasCSP = !!csp;
      
    } catch (e: any) {
      if (e.name === 'AbortError') {
        status = 'Timeout (5000ms)';
      }
    }
    
    const responseTimeMs = Date.now() - start;
    
    deploymentCheck = {
      url: deployUrl,
      status,
      statusCode,
      responseTimeMs,
      hasHSTS,
      hasCSP
    };
  }

  // 6. Generate Integrity Hash
  const hashPayload = JSON.stringify({
    githubId: repo.id,
    complexityScore,
    locTotal,
    languageStats,
    contributorCount,
    deploymentStatus: deploymentCheck?.status || 'None'
  });
  
  const integrityHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

  return {
    repoDetails: {
      githubId: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      ownerLogin: repo.owner.login
    },
    complexityScore,
    locTotal,
    languageStats,
    contributorCount,
    commitCount: 0, // Needs deep pagination, omitting for simplicity/perf
    hasTests,
    hasCI,
    deploymentCheck,
    integrityHash
  };
}
