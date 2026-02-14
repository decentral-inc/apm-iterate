import type { Stats } from '../api/client'

interface Props {
  stats: Stats
  agentOutputs: any
}

export default function LeftPanel({ stats, agentOutputs }: Props) {
  const icp = agentOutputs?.icp_agent
  const segmentation = agentOutputs?.segmentation_agent

  return (
    <div className="panel">
      <h2>📊 Intelligence</h2>

      {/* Segmentation Summary */}
      <div className="card">
        <h3>User Segments</h3>
        <div className="breakdown">
          {Object.entries(stats.by_company_size).map(([k, v]) => (
            <span className="tag" key={k}>
              <b>{v}</b> {k}
            </span>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>By Role</h3>
        <div className="breakdown">
          {Object.entries(stats.by_role).map(([k, v]) => (
            <span className="tag" key={k}>
              <b>{v}</b> {k}
            </span>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>By Industry</h3>
        <div className="breakdown">
          {Object.entries(stats.by_industry).map(([k, v]) => (
            <span className="tag" key={k}>
              <b>{v}</b> {k}
            </span>
          ))}
        </div>
      </div>

      {/* ICP Insights — populated after brief generation */}
      {icp && (
        <div className="card">
          <h3>🎯 ICP Insights</h3>
          <p>{icp.icp_summary}</p>
          {icp.primary_segment && (
            <div className="breakdown" style={{ marginTop: 10 }}>
              <span className="tag"><b>Size:</b> {icp.primary_segment.company_size}</span>
              <span className="tag"><b>Role:</b> {icp.primary_segment.role}</span>
              <span className="tag"><b>Industry:</b> {icp.primary_segment.industry}</span>
            </div>
          )}
          {icp.signals?.length > 0 && (
            <ul style={{ marginTop: 10 }}>
              {icp.signals.map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Segmentation Insights */}
      {segmentation && (
        <div className="card">
          <h3>📉 Engagement Gaps</h3>
          <p>{segmentation.engagement_summary}</p>
          {segmentation.at_risk_segments && (
            <div className="breakdown" style={{ marginTop: 10 }}>
              {segmentation.at_risk_segments.map((s: string, i: number) => (
                <span className="tag" key={i} style={{ borderColor: 'var(--danger)' }}>{s}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
