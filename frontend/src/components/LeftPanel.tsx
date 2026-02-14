import type { Stats, Brief } from '../api/client'

interface Props {
  stats: Stats
  agentOutputs: any
  brief: Brief | null
}

function confidenceColor(score: number): string {
  if (score >= 0.8) return 'var(--success)'
  if (score >= 0.5) return 'var(--warning)'
  return 'var(--danger)'
}

export default function LeftPanel({ stats, agentOutputs, brief }: Props) {
  const icp = agentOutputs?.icp_agent
  const segmentation = agentOutputs?.segmentation_agent
  const critic = agentOutputs?.critic_agent
  const competitive = brief?.content?.messaging?.competitive_analysis

  return (
    <div className="panel">
      <h2>📊 Intelligence</h2>

      {/* Confidence Score */}
      {brief && (
        <div className="card compact">
          <h3>Confidence</h3>
          <div className="confidence">
            <span style={{ fontWeight: 700, color: confidenceColor(brief.confidence_score), fontSize: '1.3rem' }}>
              {(brief.confidence_score * 100).toFixed(0)}%
            </span>
            <div className="confidence-bar">
              <div className="confidence-fill" style={{ width: `${brief.confidence_score * 100}%`, background: confidenceColor(brief.confidence_score) }} />
            </div>
          </div>
        </div>
      )}

      <div className="card compact">
        <h3>Sources</h3>
        <div className="breakdown">
          {Object.entries(stats.by_source).map(([k, v]) => (
            <span className="tag" key={k}><b>{v}</b> {k}</span>
          ))}
        </div>
      </div>

      <div className="card compact">
        <h3>Company Size</h3>
        <div className="breakdown">
          {Object.entries(stats.by_company_size).map(([k, v]) => (
            <span className="tag" key={k}><b>{v}</b> {k}</span>
          ))}
        </div>
      </div>

      <div className="card compact">
        <h3>Industries</h3>
        <div className="breakdown">
          {Object.entries(stats.by_industry).map(([k, v]) => (
            <span className="tag" key={k}><b>{v}</b> {k}</span>
          ))}
        </div>
      </div>

      {icp && (
        <div className="card compact">
          <h3>🎯 ICP</h3>
          <p style={{ fontSize: '0.72rem' }}>{icp.icp_summary}</p>
          {icp.primary_segment && (
            <div className="breakdown" style={{ marginTop: 4 }}>
              <span className="tag"><b>Size:</b> {icp.primary_segment.company_size}</span>
              <span className="tag"><b>Role:</b> {icp.primary_segment.role}</span>
              <span className="tag"><b>Ind:</b> {icp.primary_segment.industry}</span>
            </div>
          )}
        </div>
      )}

      {/* Competitive Analysis — from removed RightPanel */}
      {competitive && competitive.competitors && (
        <div className="card compact" style={{ borderColor: 'var(--accent2)' }}>
          <h3>⚔️ Competitors</h3>
          <div className="competitors-list">
            {competitive.competitors.slice(0, 3).map((c: any, i: number) => (
              <div key={i} className="competitor-item">
                <div className="competitor-name">{c.name}</div>
                <div className="competitor-details">
                  <span className="comp-tag strength">💪 {c.strength}</span>
                  <span className="comp-tag weakness">⚡ {c.weakness}</span>
                  <span className="comp-tag advantage">🏆 {c.our_advantage}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critic Review — from removed RightPanel */}
      {critic && (
        <div className="card compact" style={{ borderColor: 'var(--accent)' }}>
          <h3>🧑‍⚖️ Critic</h3>
          {critic.strengths && (
            <ul>
              {critic.strengths.slice(0, 2).map((s: string, i: number) => (
                <li key={i} style={{ color: 'var(--success)' }}>{s}</li>
              ))}
            </ul>
          )}
          {critic.weaknesses && (
            <ul>
              {critic.weaknesses.slice(0, 2).map((w: string, i: number) => (
                <li key={i} style={{ color: 'var(--danger)' }}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {segmentation && segmentation.at_risk_segments && (
        <div className="card compact">
          <h3>⚠️ At Risk</h3>
          <div className="breakdown">
            {segmentation.at_risk_segments.map((s: string, i: number) => (
              <span className="tag" key={i} style={{ borderColor: 'var(--danger)' }}>{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
