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

export default function MainPanel({
  stats, loading, error, brief, onGenerate, onFeedback,
}: Props) {
  const [feedback, setFeedback] = useState('')

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
          <div className="label">Conversion Rate</div>
        </div>
      </div>

      {/* Source Breakdown */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Source Breakdown</h3>
        <div className="breakdown">
          {Object.entries(stats.by_source).map(([k, v]) => (
            <span className="tag" key={k}><b>{v}</b> {k}</span>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        className="btn btn-primary"
        style={{ width: '100%', marginBottom: 16 }}
        disabled={loading}
        onClick={onGenerate}
      >
        {loading ? '🔄 Agents analyzing…' : '🚀 Generate Meeting Brief'}
      </button>

      {loading && (
        <div>
          <div className="spinner" />
          <p className="loading-text">
            Running 4 AI agents — ICP, Segmentation, Messaging, Critic…
          </p>
        </div>
      )}

      {error && (
        <div className="card" style={{ borderColor: 'var(--danger)' }}>
          <p style={{ color: 'var(--danger)' }}>⚠️ {error}</p>
        </div>
      )}

      {/* Executive Summary */}
      {brief && (
        <div className="card">
          <h3>📋 Executive Summary</h3>
          <p>{brief.content?.executive_summary}</p>
        </div>
      )}

      {/* Recommended Actions */}
      {brief?.content?.recommended_actions && (
        <div className="card">
          <h3>🎯 Recommended Actions</h3>
          <ul>
            {brief.content.recommended_actions.map((a: string, i: number) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Growth Hypotheses */}
      {brief?.content?.messaging?.growth_hypotheses && (
        <div className="card">
          <h3>🧪 Growth Hypotheses</h3>
          <ul>
            {brief.content.messaging.growth_hypotheses.map((h: any, i: number) => (
              <li key={i}>
                <strong>{h.hypothesis}</strong><br />
                <span style={{ fontSize: '0.78rem' }}>
                  Impact: {h.expected_impact} · Effort: {h.effort}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback Loop */}
      {brief && (
        <div className="card">
          <h3>💬 Provide Feedback</h3>
          <p style={{ marginBottom: 8 }}>
            Refine the brief — the Critic Agent will incorporate your feedback.
          </p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. Focus more on enterprise segment, add pricing objections…"
          />
          <button
            className="btn btn-secondary"
            style={{ marginTop: 8 }}
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
