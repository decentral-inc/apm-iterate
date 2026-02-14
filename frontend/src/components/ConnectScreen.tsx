import { useState } from 'react'
import { connectCrm, type Stats } from '../api/client'

interface Props {
  onConnected: (stats: Stats, source: 'salesforce' | 'hubspot') => void
}

export default function ConnectScreen({ onConnected }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async (source: 'salesforce' | 'hubspot') => {
    setLoading(source)
    setError(null)
    try {
      const result = await connectCrm(source)
      onConnected(result.stats, source)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="connect-screen">
      <h1>🧠 AI Product Intelligence</h1>
      <p>
        Connect your CRM to populate user data and unlock AI-powered meeting
        briefs, ICP analysis, and growth hypotheses.
      </p>
      <div className="btn-group">
        <button
          className="btn btn-primary"
          disabled={!!loading}
          onClick={() => handleConnect('salesforce')}
        >
          {loading === 'salesforce' ? '⏳ Connecting…' : '☁️ Connect Salesforce'}
        </button>
        <button
          className="btn btn-success"
          disabled={!!loading}
          onClick={() => handleConnect('hubspot')}
        >
          {loading === 'hubspot' ? '⏳ Connecting…' : '🟠 Connect HubSpot'}
        </button>
      </div>
      {error && <p style={{ color: 'var(--danger)' }}>Error: {error}</p>}
    </div>
  )
}
