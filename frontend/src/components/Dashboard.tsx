import { useState } from 'react'
import type { Stats, Brief, AgentEvent } from '../api/client'
import { generateBriefStream, submitFeedback } from '../api/client'
import LeftPanel from './LeftPanel'
import MainPanel from './MainPanel'
import RightPanel from './RightPanel'
import AgentProgress from './AgentProgress'
import UserList from './UserList'

interface Props {
  initialStats: Stats
}

export default function Dashboard({ initialStats }: Props) {
  const [stats] = useState<Stats>(initialStats)
  const [brief, setBrief] = useState<Brief | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([])
  const [showAgents, setShowAgents] = useState(false)
  const [showUsers, setShowUsers] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setAgentEvents([])
    setShowAgents(true)
    setBrief(null)

    try {
      await generateBriefStream((event) => {
        setAgentEvents(prev => [...prev, event])

        if (event.event === 'complete') {
          // Build brief object from SSE complete event
          const b: Brief = {
            id: event.brief_id || '',
            content: event.brief,
            summary: event.brief?.executive_summary || '',
            confidence_score: event.confidence_score || 0,
            agent_outputs: event.agent_outputs,
            feedback: null,
            parent_brief_id: null,
            created_at: event.created_at || new Date().toISOString(),
          }
          setBrief(b)
          // Keep agent progress visible for 2s then hide
          setTimeout(() => setShowAgents(false), 2000)
        }
      })
    } catch (e: any) {
      setError(e.message)
      setShowAgents(false)
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = async (feedback: string) => {
    if (!brief) return
    setLoading(true)
    setError(null)
    setAgentEvents([])
    setShowAgents(true)

    try {
      // Use non-streaming for feedback (simpler)
      const b = await submitFeedback(brief.id, feedback)
      setBrief(b)
      setShowAgents(false)
    } catch (e: any) {
      setError(e.message)
      setShowAgents(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1>🧠 AI Product Intelligence</h1>
          <span className="badge">mock CRM</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a
            href="https://login.salesforce.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ice9-link"
          >
            🔗 ICE 9 — Salesforce Integration (Feb 14, 2026)
          </a>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowUsers(true)}>
            👥 {stats.total} Users
          </button>
        </div>
      </header>

      {/* Agent progress overlay during generation */}
      {showAgents && (
        <div className="agent-overlay">
          <AgentProgress events={agentEvents} visible={showAgents} />
        </div>
      )}

      <div className={`layout ${showAgents ? 'layout-dimmed' : ''}`}>
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

      <UserList visible={showUsers} onClose={() => setShowUsers(false)} />
    </>
  )
}
