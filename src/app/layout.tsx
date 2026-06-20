import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

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
        
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
