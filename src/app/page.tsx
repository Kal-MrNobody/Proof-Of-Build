'use client';

import { useState, useEffect } from 'react';

interface Verification {
  id: number;
  repo_url: string;
  deploy_url: string;
  complexity_score: number;
  languages: string;
  deployment_status: string;
  verified_at: string;
}

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [deployUrl, setDeployUrl] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifications, setVerifications] = useState<Verification[]>([]);

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

  useEffect(() => {
    fetchLedger();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, deployUrl }),
      });
      
      if (res.ok) {
        setRepoUrl('');
        setDeployUrl('');
        await fetchLedger(); // Refresh ledger
      }
    } catch (error) {
      console.error('Verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex-col gap-8">
      {/* Hero Section */}
      <section className="glass-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
        <h1 style={{ background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Verify Your Technical Execution
        </h1>
        <p style={{ maxWidth: '600px', margin: '0 auto 2rem', fontSize: '1.1rem' }}>
          Stop relying on outdated resumes. Connect your GitHub, submit your live deployments, and generate a verified Proof of Build ledger.
        </p>
        <div className="flex justify-center gap-4">
          <button className="glow-button">Start Verification</button>
          <button className="glass-card" style={{ padding: '12px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            View Sample Ledger
          </button>
        </div>
      </section>

      {/* Submission Form & Recent Verifications Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Verification Form */}
        <section className="glass-card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Submit Artifact</h2>
          <form onSubmit={handleVerify} className="flex-col gap-4">
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>GitHub Repository URL</label>
              <input 
                type="url" 
                className="glass-input" 
                placeholder="https://github.com/username/repo" 
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                required
              />
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
              {isVerifying ? 'Verifying Artifacts...' : 'Analyze & Verify'}
            </button>
          </form>
        </section>

        {/* Dynamic Ledger Preview */}
        <section className="glass-card flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Recent Verifications</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--success-color)', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '12px' }}>Live</span>
          </div>
          
          {verifications.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No verifications yet. Submit your first artifact!
            </div>
          ) : (
            verifications.map((v) => (
              <div key={v.id} style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                    {v.repo_url.split('/').slice(-1)[0] || 'Repository'}
                  </h3>
                  <span style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-color)' }}></span>
                    Verified
                  </span>
                </div>
                
                <p style={{ fontSize: '0.9rem', margin: '0 0 6px 0' }}>
                  Complexity Score: <strong style={{ color: 'white' }}>{v.complexity_score}/100</strong>
                </p>
                
                {v.deployment_status !== 'None' && (
                  <p style={{ fontSize: '0.9rem', margin: '0 0 12px 0' }}>
                    Deployment: <strong style={{ color: v.deployment_status.includes('OK') ? 'var(--success-color)' : 'var(--danger-color)' }}>{v.deployment_status}</strong>
                  </p>
                )}

                <div className="flex gap-2" style={{ marginTop: '12px' }}>
                  {v.languages?.split(', ').map(lang => (
                    <span key={lang} style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
