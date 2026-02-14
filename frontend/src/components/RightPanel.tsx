import type { Brief } from '../api/client'

interface Props {
  brief: Brief | null
}

function confidenceColor(score: number): string {
  if (score >= 0.8) return 'var(--success)'
  if (score >= 0.5) return 'var(--warning)'
  return 'var(--danger)'
}

export default function RightPanel({ brief }: Props) {
  if (!brief) {
    return (
      <div className="panel">
        <h2>📝 Brief Output</h2>
        <div className="card compact">
          <p>Generate a meeting brief to see AI output here.</p>
        </div>
      </div>
    )
  }

  const critic = brief.agent_outputs?.critic_agent
  const messaging = brief.agent_outputs?.messaging_agent
  const competitive = brief.content?.messaging?.competitive_analysis || messaging?.competitive_analysis
  const score = brief.confidence_score

  return (
    <div className="panel">
      <h2>📝 Brief Output</h2>

      {/* Confidence Score */}
      <div className="card compact">
        <h3>Confidence Score</h3>
        <div className="confidence">
          <span style={{ fontWeight: 700, color: confidenceColor(score), fontSize: '1.4rem' }}>
            {(score * 100).toFixed(0)}%
          </span>
          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{ width: `${score * 100}%`, background: confidenceColor(score) }}
            />
          </div>
        </div>
      </div>

      {/* ICP Brief Section */}
      {brief.content?.icp && (
        <div className="card compact">
          <h3>🎯 ICP Summary</h3>
          {brief.content.icp.primary_segment && (
            <div className="breakdown">
              <span className="tag"><b>Size:</b> {brief.content.icp.primary_segment.company_size}</span>
              <span className="tag"><b>Role:</b> {brief.content.icp.primary_segment.role}</span>
              <span className="tag"><b>Industry:</b> {brief.content.icp.primary_segment.industry}</span>
            </div>
          )}
          {brief.content.icp.signals && brief.content.icp.signals.length > 0 && (
            <ul style={{ marginTop: 6 }}>
              {brief.content.icp.signals.map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Messaging Angles */}
      {messaging?.value_propositions && messaging.value_propositions.length > 0 && (
        <div className="card compact">
          <h3>💬 Messaging Angles</h3>
          {messaging.value_propositions.slice(0, 2).map((vp: any, i: number) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <strong style={{ fontSize: '0.82rem' }}>{vp.headline}</strong>
              <p style={{ fontSize: '0.78rem' }}>{vp.body}</p>
              <span className="tag" style={{ display: 'inline-block' }}>
                CTA: {vp.cta}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Competitive Analysis — replaces email hooks */}
      {competitive && (
        <div className="card compact" style={{ borderColor: 'var(--accent2)' }}>
          <h3>⚔️ Competitive Analysis</h3>
          {competitive.market_position && (
            <p style={{ marginBottom: 8 }}>{competitive.market_position}</p>
          )}
          {competitive.competitors && competitive.competitors.length > 0 && (
            <div className="competitors-list">
              {competitive.competitors.map((c: any, i: number) => (
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
          )}
          {competitive.positioning_gaps && competitive.positioning_gaps.length > 0 && (
            <>
              <p style={{ fontWeight: 600, fontSize: '0.8rem', marginTop: 8, color: 'var(--warning)' }}>Positioning Gaps</p>
              <ul>
                {competitive.positioning_gaps.map((g: string, i: number) => <li key={i}>{g}</li>)}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Critic Review */}
      {critic && (
        <div className="card compact" style={{ borderColor: 'var(--accent)' }}>
          <h3>🧑‍⚖️ Critic Review</h3>
          {critic.strengths && (
            <>
              <p style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.8rem', marginTop: 4 }}>Strengths</p>
              <ul>
                {critic.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </>
          )}
          {critic.weaknesses && (
            <>
              <p style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.8rem', marginTop: 6 }}>Weaknesses</p>
              <ul>
                {critic.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
              </ul>
            </>
          )}
          {critic.specific_suggestions && (
            <>
              <p style={{ fontWeight: 600, fontSize: '0.8rem', marginTop: 6 }}>Suggestions</p>
              <ul>
                {critic.specific_suggestions.map((s: any, i: number) => (
                  <li key={i}>
                    <strong>[{s.section}]</strong> {s.suggestion}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Engagement Drop-offs */}
      {brief.content?.segmentation?.drop_off_points && brief.content.segmentation.drop_off_points.length > 0 && (
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
    </div>
  )
}
