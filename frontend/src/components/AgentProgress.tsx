import { useEffect, useState } from 'react'
import type { AgentEvent } from '../api/client'

interface AgentState {
  agent: string
  label: string
  status: 'waiting' | 'thinking' | 'done'
  message: string
  thinking: string[]
  currentThought: number
  summary: string
  elapsed_s: number
}

interface Props {
  events: AgentEvent[]
  visible: boolean
}

const AGENT_ORDER = ['icp_agent', 'segmentation_agent', 'messaging_agent', 'critic_agent']
const AGENT_ICONS: Record<string, string> = {
  icp_agent: '🎯',
  segmentation_agent: '📊',
  messaging_agent: '💬',
  critic_agent: '🧑‍⚖️',
}

export default function AgentProgress({ events, visible }: Props) {
  const [agents, setAgents] = useState<Record<string, AgentState>>({})
  const [currentPhase, setCurrentPhase] = useState(0)

  useEffect(() => {
    const state: Record<string, AgentState> = {}

    for (const ev of events) {
      if (ev.event === 'phase_start' && ev.phase) {
        setCurrentPhase(ev.phase)
      }

      if (ev.event === 'agent_start' && ev.agent) {
        state[ev.agent] = {
          agent: ev.agent,
          label: ev.label || ev.agent,
          status: 'thinking',
          message: ev.message || '',
          thinking: ev.thinking || [],
          currentThought: 0,
          summary: '',
          elapsed_s: 0,
        }
      }

      if (ev.event === 'agent_complete' && ev.agent) {
        if (state[ev.agent]) {
          state[ev.agent].status = 'done'
          state[ev.agent].summary = ev.summary || ''
          state[ev.agent].elapsed_s = ev.elapsed_s || 0
        }
      }
    }

    setAgents({ ...state })
  }, [events])

  // Animate thinking steps
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => {
        const next = { ...prev }
        let changed = false
        for (const key of Object.keys(next)) {
          if (next[key].status === 'thinking' && next[key].thinking.length > 0) {
            const newThought = (next[key].currentThought + 1) % next[key].thinking.length
            if (newThought !== next[key].currentThought) {
              next[key] = { ...next[key], currentThought: newThought }
              changed = true
            }
          }
        }
        return changed ? next : prev
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  if (!visible) return null

  return (
    <div className="agent-progress">
      <div className="agent-progress-header">
        <h3>🤖 Agent Pipeline</h3>
        <span className="phase-badge">Phase {currentPhase}/4</span>
      </div>

      <div className="agent-cards">
        {AGENT_ORDER.map((agentKey) => {
          const a = agents[agentKey]
          const icon = AGENT_ICONS[agentKey]
          const isWaiting = !a
          const isThinking = a?.status === 'thinking'
          const isDone = a?.status === 'done'

          return (
            <div
              key={agentKey}
              className={`agent-card ${isThinking ? 'thinking' : ''} ${isDone ? 'done' : ''} ${isWaiting ? 'waiting' : ''}`}
            >
              <div className="agent-card-header">
                <span className="agent-icon">{icon}</span>
                <span className="agent-name">
                  {a?.label || agentKey.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
                {isDone && (
                  <span className="agent-time">{a.elapsed_s}s</span>
                )}
                {isThinking && <span className="agent-spinner" />}
                {isWaiting && <span className="agent-waiting">⏳</span>}
                {isDone && <span className="agent-check">✓</span>}
              </div>

              {isThinking && a.thinking.length > 0 && (
                <div className="agent-thought">
                  <span className="thought-dot" />
                  {a.thinking[a.currentThought]}
                </div>
              )}

              {isDone && a.summary && (
                <div className="agent-summary">{a.summary}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
