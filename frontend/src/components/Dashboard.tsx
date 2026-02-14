import { useState } from 'react'
import type { Stats, Brief } from '../api/client'
import { generateBrief, submitFeedback } from '../api/client'
import LeftPanel from './LeftPanel'
import MainPanel from './MainPanel'
import RightPanel from './RightPanel'

interface Props {
  initialStats: Stats
  source: string
}

export default function Dashboard({ initialStats, source }: Props) {
  const [stats] = useState<Stats>(initialStats)
  const [brief, setBrief] = useState<Brief | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const b = await generateBrief()
      setBrief(b)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = async (feedback: string) => {
    if (!brief) return
    setLoading(true)
    setError(null)
    try {
      const b = await submitFeedback(brief.id, feedback)
      setBrief(b)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1>🧠 AI Product Intelligence</h1>
          <span className="badge">{source}</span>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
          {stats.total} users imported
        </span>
      </header>

      <div className="layout">
        <LeftPanel stats={stats} agentOutputs={brief?.agent_outputs} />
        <MainPanel
          stats={stats}
          loading={loading}
          error={error}
          brief={brief}
          onGenerate={handleGenerate}
          onFeedback={handleFeedback}
        />
        <RightPanel brief={brief} />
      </div>
    </>
  )
}
