import { useState, useEffect } from 'react'
import type { Stats, Brief, AgentEvent, EngagementData, Interview } from '../api/client'
import { generateBriefStream, submitFeedback, fetchEngagementData, fetchInterviews } from '../api/client'
import LeftPanel from './LeftPanel'
import MainPanel from './MainPanel'
import AgentProgress from './AgentProgress'
import UserList from './UserList'
import InterviewPanel from './InterviewPanel'

interface Props {
  initialStats: Stats
}

export type TabId = 'dashboard' | 'interviews' | 'engagement'

export default function Dashboard({ initialStats }: Props) {
  const [stats] = useState<Stats>(initialStats)
  const [brief, setBrief] = useState<Brief | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([])
  const [showAgents, setShowAgents] = useState(false)
  const [showUsers, setShowUsers] = useState(false)
  const [engagementData, setEngagementData] = useState<EngagementData | null>(null)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')

  useEffect(() => {
    fetchEngagementData().then(setEngagementData).catch(() => {})
    fetchInterviews().then(r => setInterviews(r.interviews)).catch(() => {})
  }, [])

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
        <div className="header-left">
          <h1>🧠 APM</h1>
          <span className="badge">live</span>
        </div>
        <nav className="header-tabs">
          <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            📊 Dashboard
          </button>
          <button className={`tab-btn ${activeTab === 'interviews' ? 'active' : ''}`} onClick={() => setActiveTab('interviews')}>
            🎥 Interviews ({interviews.length})
          </button>
          <button className={`tab-btn ${activeTab === 'engagement' ? 'active' : ''}`} onClick={() => setActiveTab('engagement')}>
            📈 Engagement
          </button>
        </nav>
        <div className="header-right">
          <a
            href="https://login.salesforce.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ice9-link"
          >
            🔗 ICE 9 — Salesforce (Feb 14)
          </a>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowUsers(true)}>
            👥 {stats.total} Users
          </button>
        </div>
      </header>

      {showAgents && (
        <AgentProgress events={agentEvents} visible={showAgents} />
      )}

      <div className={`layout ${showAgents ? 'layout-dimmed' : ''}`}>
        <LeftPanel stats={stats} agentOutputs={brief?.agent_outputs} brief={brief} />
        {activeTab === 'dashboard' && (
          <MainPanel
            stats={stats}
            loading={loading}
            error={error}
            brief={brief}
            engagementData={engagementData}
            onGenerate={handleGenerate}
            onFeedback={handleFeedback}
          />
        )}
        {activeTab === 'interviews' && (
          <InterviewPanel interviews={interviews} />
        )}
        {activeTab === 'engagement' && (
          <MainPanel
            stats={stats}
            loading={loading}
            error={error}
            brief={brief}
            engagementData={engagementData}
            onGenerate={handleGenerate}
            onFeedback={handleFeedback}
            showEngagementOnly
          />
        )}
      </div>

      <UserList visible={showUsers} onClose={() => setShowUsers(false)} />
    </>
  )
}
