'use client';

import { useState, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [deployUrl, setDeployUrl] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchLedger = async () => {
    try {
      const res = await fetch('/api/ledger');
      const data = await res.json();
      if (data.success) {
        setVerifications(data.data);
      }
    } catch (error) {
      console.error('Error fetching ledger:', error);
    }
  };

  const fetchRepos = async () => {
    try {
      const res = await fetch('/api/repos');
      const data = await res.json();
      if (data.success) {
        setRepos(data.data);
      }
    } catch (error) {
      console.error('Error fetching repos:', error);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  useEffect(() => {
    if (session) {
      fetchRepos();
    }
  }, [session]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo) {
      setErrorMsg('Please select a repository');
      return;
    }
    
    setIsVerifying(true);
    setErrorMsg('');
    
    try {
      const [owner, name] = selectedRepo.split('/');
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoOwner: owner, repoName: name, deployUrl }),
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setDeployUrl('');
        setSelectedRepo('');
        await fetchLedger(); // Refresh ledger
      } else {
        setErrorMsg(data.error || 'Verification failed');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Network error');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <nav className="glass-card" style={{ margin: '24px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
          <span style={{ color: 'var(--accent-color)' }}>Proof</span>OfBuild
        </div>
        <div className="flex gap-4 items-center">
          {status === 'loading' ? (
            <span>Loading...</span>
          ) : session ? (
            <>
              <span style={{ color: 'var(--text-secondary)' }}>{session.user?.email}</span>
              <button className="glow-button" style={{ padding: '8px 16px', fontSize: '0.9rem', background: 'transparent', border: '1px solid var(--accent-color)' }} onClick={() => signOut()}>Sign Out</button>
            </>
          ) : (
            <button className="glow-button" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => signIn('github')}>Connect GitHub</button>
          )}
        </div>
      </nav>

      <div className="flex-col gap-8" style={{ marginTop: '40px' }}>
        {/* Hero Section */}
        <section className="glass-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <h1 style={{ background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Verify Your Technical Execution
          </h1>
          <p style={{ maxWidth: '600px', margin: '0 auto 2rem', fontSize: '1.1rem' }}>
            Connect your GitHub to analyze real repository metrics and verify live deployments on the tamper-evident ledger.
          </p>
        </section>

        {/* Submission Form & Recent Verifications Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Verification Form */}
          <section className="glass-card">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Submit Artifact</h2>
            
            {!session ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>You must sign in with GitHub to verify repositories.</p>
                <button className="glow-button" onClick={() => signIn('github')}>Sign In with GitHub</button>
              </div>
            ) : (
              <form onSubmit={handleVerify} className="flex-col gap-4">
                {errorMsg && <div style={{ color: 'var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}>{errorMsg}</div>}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Select Repository</label>
                  <select 
                    className="glass-input" 
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    required
                    style={{ appearance: 'none', background: 'rgba(0, 0, 0, 0.5)' }}
                  >
                    <option value="" disabled>Select a repo...</option>
                    {repos.map(r => (
                      <option key={r.id} value={r.full_name}>{r.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Live Deployment URL (Optional)</label>
                  <input 
                    type="url" 
                    className="glass-input" 
                    placeholder="https://my-app.vercel.app" 
                    value={deployUrl}
                    onChange={(e) => setDeployUrl(e.target.value)}
                  />
                </div>
                <button 
                  type="submit" 
                  className="glow-button" 
                  style={{ marginTop: '1rem', opacity: isVerifying ? 0.7 : 1 }}
                  disabled={isVerifying}
                >
                  {isVerifying ? 'Running Real Verification...' : 'Analyze & Verify'}
                </button>
              </form>
            )}
          </section>

          {/* Dynamic Ledger Preview */}
          <section className="glass-card flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Public Proof Ledger</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--success-color)', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '12px' }}>Live</span>
            </div>
            
            {verifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No verifications yet.
              </div>
            ) : (
              verifications.map((v) => (
                <div key={v.id} style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                      <a href={v.repo?.url} target="_blank" rel="noreferrer" style={{ color: 'white', textDecoration: 'none' }}>
                        {v.repo?.fullName || 'Repository'}
                      </a>
                    </h3>
                    <span style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-color)' }}></span>
                      Verified
                    </span>
                  </div>
                  
                  <p style={{ fontSize: '0.9rem', margin: '0 0 6px 0' }}>
                    Complexity Score: <strong style={{ color: 'white' }}>{v.complexityScore}/100</strong>
                    <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>({v.locTotal} LOC, {v.contributorCount} devs)</span>
                  </p>
                  
                  {v.deploymentCheck && (
                    <p style={{ fontSize: '0.9rem', margin: '0 0 12px 0' }}>
                      Deployment: <strong style={{ color: v.deploymentCheck.status.includes('OK') ? 'var(--success-color)' : 'var(--danger-color)' }}>{v.deploymentCheck.status}</strong>
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>({v.deploymentCheck.responseTimeMs}ms)</span>
                    </p>
                  )}

                  <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    Hash: {v.integrityHash}
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </>
  );
}
