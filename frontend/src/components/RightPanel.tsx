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
        <div className="card">
          <p>Generate a meeting brief to see AI output here.</p>
        </div>
      </div>
    )
  }

  const critic = brief.agent_outputs?.critic_agent
  const messaging = brief.agent_outputs?.messaging_agent
  const score = brief.confidence_score

  return (
    <div className="panel">
      <h2>📝 Brief Output</h2>

      {/* Confidence Score */}
      <div className="card">
        <h3>Confidence Score</h3>
        <div className="confidence">
          <span style={{ fontWeight: 700, color: confidenceColor(score) }}>
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
        <div className="card">
          <h3>🎯 ICP Summary</h3>
          {brief.content.icp.primary_segment && (
            <div className="breakdown">
              <span className="tag"><b>Size:</b> {brief.content.icp.primary_segment.company_size}</span>
              <span className="tag"><b>Role:</b> {brief.content.icp.primary_segment.role}</span>
              <span className="tag"><b>Industry:</b> {brief.content.icp.primary_segment.industry}</span>
            </div>
          )}
          {brief.content.icp.signals && (
            <ul style={{ marginTop: 8 }}>
              {brief.content.icp.signals.map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Messaging */}
      {messaging?.value_propositions && (
        <div className="card">
          <h3>💬 Messaging Angles</h3>
          {messaging.value_propositions.map((vp: any, i: number) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <strong>{vp.headline}</strong>
              <p>{vp.body}</p>
              <span className="tag" style={{ marginTop: 4, display: 'inline-block' }}>
                CTA: {vp.cta}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Email Hooks */}
      {messaging?.email_hooks && (
        <div className="card">
          <h3>✉️ Email Hooks</h3>
          {messaging.email_hooks.map((eh: any, i: number) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <strong>{eh.subject_line}</strong>
              <p>{eh.preview_text}</p>
              <span className="tag">{eh.target_segment}</span>
            </div>
          ))}
        </div>
      )}

      {/* Critic Feedback */}
      {critic && (
        <div className="card" style={{ borderColor: 'var(--accent)' }}>
          <h3>🧑‍⚖️ Critic Review</h3>

          {critic.strengths && (
            <>
              <p style={{ color: 'var(--success)', fontWeight: 600, marginTop: 8 }}>Strengths</p>
              <ul>
                {critic.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </>
          )}

          {critic.weaknesses && (
            <>
              <p style={{ color: 'var(--danger)', fontWeight: 600, marginTop: 8 }}>Weaknesses</p>
              <ul>
                {critic.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
              </ul>
            </>
          )}

          {critic.specific_suggestions && (
            <>
              <p style={{ fontWeight: 600, marginTop: 8 }}>Improvement Suggestions</p>
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
      {brief.content?.segmentation?.drop_off_points && (
        <div className="card">
          <h3>📉 Engagement Drop-offs</h3>
          <ul>
            {brief.content.segmentation.drop_off_points.map((d: any, i: number) => (
              <li key={i}>
                <strong>{d.stage}</strong> ({d.severity}): {d.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
