import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Proof of Build | Rabbitt AI',
  description: 'Automated Artifact Verification and Dynamic Portfolio System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="bg-blobs">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
        </div>
        
        <nav className="glass-card" style={{ margin: '24px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
            <span style={{ color: 'var(--accent-color)' }}>Proof</span>OfBuild
          </div>
          <div className="flex gap-4">
            <button className="glow-button" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Connect GitHub</button>
          </div>
        </nav>

        <main className="container" style={{ marginTop: '40px', marginBottom: '80px' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
