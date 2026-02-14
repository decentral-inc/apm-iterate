import { useState } from 'react'
import type { Stats, Brief } from '../api/client'

interface Props {
  stats: Stats
  loading: boolean
  error: string | null
  brief: Brief | null
  onGenerate: () => void
  onFeedback: (feedback: string) => void
}

const ACTION_ICONS: Record<string, string> = {
  send_email: '✉️',
  schedule_zoom: '📹',
  schedule_meeting: '📅',
  crm_update: '🔄',
  create_campaign: '📣',
  send_slack: '💬',
}

const ACTION_LABELS: Record<string, string> = {
  send_email: 'Send Email',
  schedule_zoom: 'Schedule Zoom',
  schedule_meeting: 'Book Meeting',
  crm_update: 'Update CRM',
  create_campaign: 'Launch Campaign',
  send_slack: 'Send Slack',
}

const ACTION_COLORS: Record<string, string> = {
  send_email: '#6c5ce7',
  schedule_zoom: '#0984e3',
  schedule_meeting: '#00b894',
  crm_update: '#fdcb6e',
  create_campaign: '#e17055',
  send_slack: '#a29bfe',
}

export default function MainPanel({
  stats, loading, error, brief, onGenerate, onFeedback,
}: Props) {
  const [feedback, setFeedback] = useState('')
  const [executedActions, setExecutedActions] = useState<Set<number>>(new Set())

  const handleAction = (index: number, action: any) => {
    setExecutedActions(prev => new Set(prev).add(index))
    // Simulate action execution
    const type = action.type || 'send_email'
    if (type === 'send_email') {
      window.open(`mailto:?subject=${encodeURIComponent(action.action)}&body=${encodeURIComponent(action.details || '')}`)
    } else if (type === 'schedule_zoom') {
      window.open('https://zoom.us/meeting/schedule', '_blank')
    } else if (type === 'schedule_meeting') {
      window.open('https://calendar.google.com/calendar/r/eventedit', '_blank')
    } else if (type === 'crm_update') {
      window.open('https://login.salesforce.com', '_blank')
    } else if (type === 'create_campaign') {
      window.open('https://login.salesforce.com', '_blank')
    } else if (type === 'send_slack') {
      window.open('https://slack.com', '_blank')
    }
  }

  return (
    <div className="panel">
      <h2>📈 Dashboard</h2>

      {/* Metric Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="value">{stats.total}</div>
          <div className="label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="value" style={{ color: 'var(--success)' }}>{stats.signed_up}</div>
          <div className="label">Signed Up</div>
        </div>
        <div className="stat-card">
          <div className="value" style={{ color: 'var(--warning)' }}>{stats.not_engaged}</div>
          <div className="label">Not Engaged</div>
        </div>
        <div className="stat-card">
          <div className="value" style={{ color: 'var(--accent)' }}>
            {stats.total > 0 ? `${((stats.signed_up / stats.total) * 100).toFixed(1)}%` : '—'}
          </div>
          <div className="label">Conversion</div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        className="btn btn-primary"
        style={{ width: '100%', marginBottom: 12 }}
        disabled={loading}
        onClick={onGenerate}
      >
        {loading ? '🔄 Agents analyzing…' : '🚀 Generate Meeting Brief'}
      </button>

      {error && (
        <div className="card" style={{ borderColor: 'var(--danger)', marginBottom: 12 }}>
          <p style={{ color: 'var(--danger)', margin: 0, fontSize: '0.82rem' }}>⚠️ {error}</p>
        </div>
      )}

      {/* Executive Summary */}
      {brief && (
        <div className="card compact">
          <h3>📋 Executive Summary</h3>
          <p>{brief.content?.executive_summary}</p>
        </div>
      )}

      {/* Recommended Actions — Actionable */}
      {brief?.content?.recommended_actions && brief.content.recommended_actions.length > 0 && (
        <div className="card compact">
          <h3>🎯 Recommended Actions</h3>
          <div className="actions-list">
            {brief.content.recommended_actions.map((a: any, i: number) => {
              const type = a.type || 'send_email'
              const icon = ACTION_ICONS[type] || '📌'
              const label = ACTION_LABELS[type] || 'Execute'
              const color = ACTION_COLORS[type] || 'var(--accent)'
              const isExecuted = executedActions.has(i)
              const priority = a.priority || 'medium'

              return (
                <div key={i} className={`action-item priority-${priority}`}>
                  <div className="action-content">
                    <div className="action-top">
                      <span className="action-icon">{icon}</span>
                      <span className="action-text">{a.action}</span>
                      <span className={`priority-tag ${priority}`}>{priority}</span>
                    </div>
                    {a.target_segment && (
                      <div className="action-target">Target: {a.target_segment}</div>
                    )}
                    {a.details && (
                      <div className="action-details">{a.details}</div>
                    )}
                  </div>
                  <button
                    className={`btn-action ${isExecuted ? 'executed' : ''}`}
                    style={{ borderColor: color, color: isExecuted ? '#fff' : color, background: isExecuted ? color : 'transparent' }}
                    onClick={() => handleAction(i, a)}
                  >
                    {isExecuted ? '✓ Done' : label}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Growth Hypotheses */}
      {brief?.content?.messaging?.growth_hypotheses && (
        <div className="card compact">
          <h3>🧪 Growth Hypotheses</h3>
          <div className="hypotheses-list">
            {brief.content.messaging.growth_hypotheses.map((h: any, i: number) => (
              <div key={i} className="hypothesis-item">
                <div className="hypothesis-text">{h.hypothesis}</div>
                <div className="hypothesis-meta">
                  <span className={`impact-tag ${h.expected_impact}`}>
                    Impact: {h.expected_impact}
                  </span>
                  <span className={`effort-tag ${h.effort}`}>
                    Effort: {h.effort}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Loop */}
      {brief && (
        <div className="card compact">
          <h3>💬 Iterate</h3>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Refine the brief — Critic Agent will incorporate your feedback…"
            rows={2}
          />
          <button
            className="btn btn-secondary"
            style={{ marginTop: 6, width: '100%' }}
            disabled={loading || !feedback.trim()}
            onClick={() => { onFeedback(feedback); setFeedback('') }}
          >
            ♻️ Regenerate with Feedback
          </button>
        </div>
      )}
    </div>
  )
}
