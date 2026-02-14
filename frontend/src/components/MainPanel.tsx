import { useState } from 'react'
import type { Stats, Brief, EngagementData } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell,
} from 'recharts'

interface Props {
  stats: Stats
  loading: boolean
  error: string | null
  brief: Brief | null
  engagementData: EngagementData | null
  onGenerate: () => void
  onFeedback: (feedback: string) => void
  showEngagementOnly?: boolean
}

const ACTION_ICONS: Record<string, string> = {
  send_email: '✉️', schedule_zoom: '📹', schedule_meeting: '📅',
  crm_update: '🔄', create_campaign: '📣', send_slack: '💬',
}
const ACTION_LABELS: Record<string, string> = {
  send_email: 'Send Email', schedule_zoom: 'Schedule Zoom', schedule_meeting: 'Book Meeting',
  crm_update: 'Update CRM', create_campaign: 'Launch Campaign', send_slack: 'Send Slack',
}
const PRODUCT_ACTION_LABELS: Record<string, string> = {
  create_jira: '📋 Create Jira', write_prd: '📝 Write PRD', run_ab_test: '🧪 A/B Test',
  design_sprint: '🎨 Design Sprint', ship_fix: '🚀 Ship Fix',
}
const CATEGORY_COLORS: Record<string, string> = {
  ux: '#6c5ce7', feature: '#00b894', integration: '#0984e3',
  pricing: '#fdcb6e', performance: '#e17055',
}
const FUNNEL_COLORS = ['#6c5ce7', '#a29bfe', '#00cec9', '#00b894', '#fdcb6e', '#e17055', '#ff6b6b']

export default function MainPanel({
  stats, loading, error, brief, engagementData, onGenerate, onFeedback, showEngagementOnly,
}: Props) {
  const [feedback, setFeedback] = useState('')
  const [executedActions, setExecutedActions] = useState<Set<number>>(new Set())
  const [showProductRecs, setShowProductRecs] = useState(false)
  const [selectedRecs, setSelectedRecs] = useState<Set<number>>(new Set())

  const handleAction = (index: number, action: any) => {
    setExecutedActions(prev => new Set(prev).add(index))
    const type = action.type || 'send_email'
    const urls: Record<string, string> = {
      send_email: `mailto:?subject=${encodeURIComponent(action.action)}&body=${encodeURIComponent(action.details || '')}`,
      schedule_zoom: 'https://zoom.us/meeting/schedule',
      schedule_meeting: 'https://calendar.google.com/calendar/r/eventedit',
      crm_update: 'https://login.salesforce.com',
      create_campaign: 'https://login.salesforce.com',
      send_slack: 'https://slack.com',
    }
    window.open(urls[type] || '#', type === 'send_email' ? '_self' : '_blank')
  }

  const toggleRec = (i: number) => {
    setSelectedRecs(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  // ── Engagement-only view ──
  if (showEngagementOnly && engagementData) {
    return (
      <div className="panel main-panel">
        <h2>📈 Engagement Data</h2>
        {renderEngagementCharts(engagementData)}
      </div>
    )
  }

  return (
    <div className="panel main-panel">
      <h2>📈 Dashboard</h2>

      {/* Stats Row */}
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

      <button
        className="btn btn-primary"
        style={{ width: '100%', marginBottom: 10 }}
        disabled={loading}
        onClick={onGenerate}
      >
        {loading ? '🔄 Agents analyzing…' : '🚀 Generate Meeting Brief'}
      </button>

      {error && (
        <div className="card" style={{ borderColor: 'var(--danger)', marginBottom: 8 }}>
          <p style={{ color: 'var(--danger)', margin: 0, fontSize: '0.78rem' }}>⚠️ {error}</p>
        </div>
      )}

      {/* Mini engagement chart */}
      {engagementData && !brief && (
        <div className="card compact">
          <h3>📊 Weekly Signups</h3>
          <div style={{ height: 120, marginTop: 4 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementData.weekly_trends}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#8b8fa3' }} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2d3141', borderRadius: 6, fontSize: 11 }} />
                <Area type="monotone" dataKey="signups" stroke="#6c5ce7" fill="url(#grad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Executive Summary */}
      {brief && (
        <div className="card compact">
          <h3>📋 Executive Summary</h3>
          <p>{brief.content?.executive_summary}</p>
        </div>
      )}

      {/* Conversion Funnel */}
      {brief && engagementData && (
        <div className="card compact">
          <h3>🔄 Conversion Funnel</h3>
          <div className="funnel-visual">
            {engagementData.funnel.map((f, i) => {
              const maxCount = engagementData.funnel[0]?.count || 1
              const widthPct = Math.max(20, (f.count / maxCount) * 100)
              const nextWidth = i < engagementData.funnel.length - 1
                ? Math.max(20, (engagementData.funnel[i + 1].count / maxCount) * 100)
                : widthPct * 0.85
              const dropoff = i > 0
                ? engagementData.funnel[i - 1].count - f.count
                : 0
              return (
                <div key={i} className="funnel-stage">
                  <div
                    className="funnel-trapezoid"
                    style={{
                      '--top-w': `${widthPct}%`,
                      '--bot-w': `${nextWidth}%`,
                      '--color': FUNNEL_COLORS[i],
                    } as React.CSSProperties}
                  >
                    <div className="funnel-stage-content">
                      <span className="funnel-stage-name">{f.stage}</span>
                      <span className="funnel-stage-count">{f.count.toLocaleString()}</span>
                    </div>
                  </div>
                  {dropoff > 0 && (
                    <div className="funnel-dropoff">
                      <span className="dropoff-arrow">↓</span>
                      <span className="dropoff-value">-{dropoff.toLocaleString()} ({(100 - f.rate).toFixed(0)}% drop)</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Drop-offs */}
      {brief?.content?.segmentation?.drop_off_points && brief.content.segmentation.drop_off_points.length > 0 && (
        <div className="card compact">
          <h3>📉 Drop-offs</h3>
          {brief.content.segmentation.drop_off_points.map((d: any, i: number) => (
            <div key={i} className="dropoff-item">
              <span className={`severity-dot ${d.severity}`} />
              <strong>{d.stage}</strong>: {d.description}
            </div>
          ))}
        </div>
      )}

      {/* Recommended Actions */}
      {brief?.content?.recommended_actions && brief.content.recommended_actions.length > 0 && (
        <div className="card compact">
          <h3>🎯 Recommended Actions</h3>
          <div className="actions-list">
            {brief.content.recommended_actions.slice(0, 5).map((a: any, i: number) => {
              const type = a.type || 'send_email'
              const icon = ACTION_ICONS[type] || '📌'
              const label = ACTION_LABELS[type] || 'Execute'
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
                    {a.target_segment && <div className="action-target">→ {a.target_segment}</div>}
                  </div>
                  <button
                    className={`btn-action ${isExecuted ? 'executed' : ''}`}
                    onClick={() => handleAction(i, a)}
                  >
                    {isExecuted ? '✓' : label}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Product Recommendations — expandable */}
      {brief?.content?.product_recommendations && brief.content.product_recommendations.length > 0 && (
        <div className="card compact">
          <div className="expandable-header" onClick={() => setShowProductRecs(!showProductRecs)}>
            <h3>🛠️ Product Recommendations ({brief.content.product_recommendations.length})</h3>
            <span className="expand-icon">{showProductRecs ? '▼' : '▶'}</span>
          </div>
          {showProductRecs && (
            <div className="product-recs">
              <p className="recs-hint">Select recommendations to implement — based on interview insights & engagement data.</p>
              {brief.content.product_recommendations.map((r: any, i: number) => {
                const isSelected = selectedRecs.has(i)
                const catColor = CATEGORY_COLORS[r.category] || 'var(--muted)'
                const actionLabel = PRODUCT_ACTION_LABELS[r.action_type] || '📌 Execute'
                return (
                  <div key={i} className={`product-rec ${isSelected ? 'selected' : ''}`}>
                    <div className="rec-checkbox" onClick={() => toggleRec(i)}>
                      {isSelected ? '☑' : '☐'}
                    </div>
                    <div className="rec-body">
                      <div className="rec-title">
                        <span className="rec-cat" style={{ background: catColor }}>{r.category}</span>
                        {r.title}
                      </div>
                      <div className="rec-desc">{r.description}</div>
                      <div className="rec-meta">
                        <span className="rec-source">📎 {r.source}</span>
                        <span className={`impact-tag ${r.impact}`}>Impact: {r.impact}</span>
                        <span className={`effort-tag ${r.effort}`}>Effort: {r.effort}</span>
                      </div>
                    </div>
                    <button className="btn-action rec-action" onClick={() => {
                      const urls: Record<string, string> = {
                        create_jira: 'https://jira.atlassian.com/secure/CreateIssue!default.jspa',
                        write_prd: 'https://docs.google.com/document/create',
                        run_ab_test: 'https://optimize.google.com/',
                        design_sprint: 'https://miro.com/app/board/',
                        ship_fix: 'https://github.com/',
                      }
                      window.open(urls[r.action_type] || 'https://linear.app', '_blank')
                    }}>
                      {actionLabel}
                    </button>
                  </div>
                )
              })}
              {selectedRecs.size > 0 && (
                <div className="recs-footer">
                  <button className="btn btn-success btn-sm" onClick={() => alert(`Creating ${selectedRecs.size} items in your backlog...`)}>
                    ✅ Add {selectedRecs.size} to Backlog
                  </button>
                </div>
              )}
            </div>
          )}
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
                  <span className={`impact-tag ${h.expected_impact}`}>Impact: {h.expected_impact}</span>
                  <span className={`effort-tag ${h.effort}`}>Effort: {h.effort}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
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
            style={{ marginTop: 4, width: '100%' }}
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

/* ── Engagement Charts Sub-Component ── */
function renderEngagementCharts(data: EngagementData) {
  const COLORS = ['#6c5ce7', '#00cec9', '#00b894', '#fdcb6e']

  return (
    <>
      {/* DAU Trend */}
      <div className="card compact">
        <h3>Daily Active Users (Trend)</h3>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.weekly_trends}>
              <defs>
                <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00cec9" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00cec9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#8b8fa3' }} />
              <YAxis tick={{ fontSize: 10, fill: '#8b8fa3' }} width={40} />
              <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2d3141', borderRadius: 6, fontSize: 11 }} />
              <Area type="monotone" dataKey="dau" stroke="#00cec9" fill="url(#dauGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Adoption by Segment */}
      <div className="card compact">
        <h3>Feature Adoption by Segment</h3>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.feature_adoption} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: '#8b8fa3' }} domain={[0, 100]} />
              <YAxis type="category" dataKey="feature" tick={{ fontSize: 10, fill: '#8b8fa3' }} width={80} />
              <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2d3141', borderRadius: 6, fontSize: 11 }} />
              <Bar dataKey="enterprise" fill={COLORS[0]} name="Enterprise" radius={[0, 3, 3, 0]} />
              <Bar dataKey="mid_market" fill={COLORS[1]} name="Mid-Market" radius={[0, 3, 3, 0]} />
              <Bar dataKey="smb" fill={COLORS[2]} name="SMB" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-dot" style={{ background: COLORS[0] }} /> Enterprise</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: COLORS[1] }} /> Mid-Market</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: COLORS[2] }} /> SMB</span>
        </div>
      </div>

      {/* Segments Table */}
      <div className="card compact">
        <h3>Segment Health</h3>
        <table className="segment-table">
          <thead>
            <tr>
              <th>Segment</th>
              <th>Users</th>
              <th>Revenue</th>
              <th>DAU/MAU</th>
              <th>Health</th>
            </tr>
          </thead>
          <tbody>
            {data.segments.map((s, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td>{s.users}</td>
                <td>${(s.revenue / 1000).toFixed(0)}k</td>
                <td>{s.dau_mau}%</td>
                <td>
                  <div className="health-bar-wrap">
                    <div className="health-bar" style={{ width: `${s.health}%`, background: s.health > 70 ? 'var(--success)' : s.health > 40 ? 'var(--warning)' : 'var(--danger)' }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* NPS Trend */}
      <div className="card compact">
        <h3>NPS Score (Weekly)</h3>
        <div style={{ height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.weekly_trends}>
              <defs>
                <linearGradient id="npsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00b894" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00b894" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#8b8fa3' }} />
              <YAxis tick={{ fontSize: 10, fill: '#8b8fa3' }} width={30} domain={[20, 55]} />
              <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2d3141', borderRadius: 6, fontSize: 11 }} />
              <Area type="monotone" dataKey="nps" stroke="#00b894" fill="url(#npsGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}
