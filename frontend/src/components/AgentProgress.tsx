import { useState, useEffect, useRef } from 'react'
import type { AgentEvent } from '../api/client'

interface Props {
  events: AgentEvent[]
  visible: boolean
}

interface AgentState {
  name: string
  label: string
  message: string
  thinkingSteps: string[]
  status: 'waiting' | 'running' | 'done'
  summary: string | null
  elapsed: number | null
  thinkingIndex: number
}

const AGENT_ORDER = ['icp_agent', 'segmentation_agent', 'messaging_agent', 'critic_agent']
const AGENT_DEFAULT: Record<string, { label: string; message: string }> = {
  icp_agent: { label: 'ICP Agent', message: 'Building ideal customer profiles…' },
  segmentation_agent: { label: 'Segmentation Agent', message: 'Segmenting user base by behavior…' },
  messaging_agent: { label: 'Messaging Agent', message: 'Crafting competitive messaging strategy…' },
  critic_agent: { label: 'Critic Agent', message: 'Reviewing brief for quality & gaps…' },
}

export default function AgentProgress({ events, visible }: Props) {
  const [agents, setAgents] = useState<Record<string, AgentState>>(() => buildInitial())
  const [currentPhase, setCurrentPhase] = useState(0)
  const [phaseLabel, setPhaseLabel] = useState('')
  const [composeDone, setComposeDone] = useState(false)
  const intervalRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({})

  function buildInitial(): Record<string, AgentState> {
    const m: Record<string, AgentState> = {}
    for (const name of AGENT_ORDER) {
      m[name] = {
        name,
        label: AGENT_DEFAULT[name].label,
        message: AGENT_DEFAULT[name].message,
        thinkingSteps: [],
        status: 'waiting',
        summary: null,
        elapsed: null,
        thinkingIndex: -1,
      }
    }
    return m
  }

  // Process incoming events
  useEffect(() => {
    if (events.length === 0) {
      setAgents(buildInitial())
      setCurrentPhase(0)
      setComposeDone(false)
      return
    }
    const last = events[events.length - 1]
    setAgents(prev => {
      const next = { ...prev }
      for (const ev of events) {
        if (ev.event === 'phase_start') {
          setCurrentPhase(ev.phase || 0)
          setPhaseLabel(ev.label || '')
        }
        if (ev.event === 'agent_start' && ev.agent && next[ev.agent]) {
          next[ev.agent] = {
            ...next[ev.agent],
            status: 'running',
            label: ev.label || next[ev.agent].label,
            message: ev.message || next[ev.agent].message,
            thinkingSteps: ev.thinking || [],
            thinkingIndex: -1,
          }
        }
        if (ev.event === 'agent_complete' && ev.agent && next[ev.agent]) {
          next[ev.agent] = {
            ...next[ev.agent],
            status: 'done',
            summary: ev.summary || 'Done',
            elapsed: ev.elapsed_s || null,
          }
        }
        if (ev.event === 'compose_complete') {
          setComposeDone(true)
        }
      }
      return next
    })
  }, [events])

  // Animate thinking steps for running agents
  useEffect(() => {
    // Clear previous intervals
    Object.values(intervalRefs.current).forEach(clearInterval)
    intervalRefs.current = {}

    for (const agent of Object.values(agents)) {
      if (agent.status === 'running' && agent.thinkingSteps.length > 0) {
        const tick = () => {
          setAgents(prev => {
            const a = prev[agent.name]
            if (!a || a.status !== 'running') return prev
            const nextIdx = a.thinkingIndex < a.thinkingSteps.length - 1 ? a.thinkingIndex + 1 : 0
            return { ...prev, [agent.name]: { ...a, thinkingIndex: nextIdx } }
          })
        }
        tick()
        intervalRefs.current[agent.name] = setInterval(tick, 2200)
      }
    }
    return () => Object.values(intervalRefs.current).forEach(clearInterval)
  }, [agents.icp_agent?.status, agents.segmentation_agent?.status, agents.messaging_agent?.status, agents.critic_agent?.status])

  if (!visible) return null

  const isComplete = events.some(e => e.event === 'complete')

  return (
    <div className="agent-overlay">
      <div className="agent-progress-panel">
        <div className="agent-progress-header">
          <h2>{isComplete ? '✅ Analysis Complete' : '🤖 AI Agents Working…'}</h2>
          {currentPhase > 0 && !isComplete && (
            <div className="phase-indicator">
              Phase {currentPhase}/4 — {phaseLabel}
            </div>
          )}
        </div>

        {/* Phase progress bar */}
        <div className="phase-bar">
          {[1, 2, 3, 4].map(p => (
            <div
              key={p}
              className={`phase-segment ${p < currentPhase ? 'done' : p === currentPhase ? 'active' : ''} ${isComplete ? 'done' : ''}`}
            />
          ))}
        </div>

        {/* Agent Cards */}
        <div className="agent-cards">
          {AGENT_ORDER.map(name => {
            const a = agents[name]
            if (!a) return null
            const statusIcon = a.status === 'done' ? '✅' : a.status === 'running' ? '⚡' : '⏳'
            const thinking = a.thinkingIndex >= 0 && a.thinkingIndex < a.thinkingSteps.length
              ? a.thinkingSteps[a.thinkingIndex] : null

            return (
              <div key={name} className={`agent-card status-${a.status}`}>
                <div className="agent-card-header">
                  <span className="agent-status-icon">{statusIcon}</span>
                  <span className="agent-label">{a.label}</span>
                  {a.elapsed !== null && (
                    <span className="agent-time">{a.elapsed.toFixed(1)}s</span>
                  )}
                </div>
                <div className="agent-message">{a.message}</div>

                {a.status === 'running' && thinking && (
                  <div className="thinking-bubble">
                    <span className="thinking-dots"><span>.</span><span>.</span><span>.</span></span>
                    {thinking}
                  </div>
                )}

                {a.status === 'done' && a.summary && (
                  <div className="agent-summary">{a.summary}</div>
                )}
              </div>
            )
          })}
        </div>

        {composeDone && !isComplete && (
          <div className="compose-status">📝 Brief composed — running quality review…</div>
        )}
      </div>
    </div>
  )
}
