import { useState } from 'react'
import { mockConnectCrm, type Stats } from '../api/client'

interface Props {
  onConnected: (stats: Stats) => void
}

export default function ConnectScreen({ onConnected }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await mockConnectCrm()
      onConnected(result.stats)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="connect-screen">
      <h1>🧠 AI Product Intelligence</h1>
      <p>
        Connect your CRM to populate user data and unlock AI-powered meeting
        briefs, ICP analysis, and growth hypotheses.
      </p>
      <button className="btn btn-primary" disabled={loading} onClick={handleConnect}>
        {loading ? '⏳ Connecting…' : '🔗 Mock Connect CRM'}
      </button>
      {error && <p style={{ color: 'var(--danger)' }}>Error: {error}</p>}
    </div>
  )
}
