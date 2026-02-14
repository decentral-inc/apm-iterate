import { useState } from 'react'
import type { Interview } from '../api/client'
import { fetchInterview } from '../api/client'

interface Props {
  interviews: Interview[]
}

export default function InterviewPanel({ interviews }: Props) {
  const [selected, setSelected] = useState<Interview | null>(null)
  const [loading, setLoading] = useState(false)
  const [integrated, setIntegrated] = useState<Set<number>>(() => new Set(interviews.map(i => i.id)))
  const [playVideo, setPlayVideo] = useState(false)

  const loadInterview = async (id: number) => {
    if (selected?.id === id) { setSelected(null); setPlayVideo(false); return }
    setLoading(true)
    setPlayVideo(false)
    try {
      const full = await fetchInterview(id)
      setSelected(full)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const toggleIntegrated = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setIntegrated(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="panel main-panel">
      <h2>🎙️ User Interviews ({interviews.length})</h2>
      <p className="interview-subtitle">
        Transcripts from user research sessions. Toggle integration to include/exclude from AI analysis.
      </p>

      <div className="interview-stats-row">
        <div className="mini-stat">
          <strong>{integrated.size}</strong>
          <span>Integrated</span>
        </div>
        <div className="mini-stat">
          <strong>{interviews.length - integrated.size}</strong>
          <span>Excluded</span>
        </div>
        <div className="mini-stat">
          <strong>{interviews.reduce((s, i) => s + (i.key_insights?.length || 0), 0)}</strong>
          <span>Insights</span>
        </div>
      </div>

      {/* Interview Grid */}
      <div className="interview-grid">
        {interviews.map(interview => {
          const isActive = selected?.id === interview.id
          const isIntegrated = integrated.has(interview.id)
          const thumb = `https://img.youtube.com/vi/${interview.video_id}/mqdefault.jpg`

          return (
            <div
              key={interview.id}
              className={`interview-card ${isActive ? 'active' : ''} ${isIntegrated ? '' : 'excluded'}`}
              onClick={() => loadInterview(interview.id)}
            >
              <div className="interview-thumb" style={{ backgroundImage: `url(${thumb})` }}>
                <div className="play-overlay">▶</div>
                <div className="interview-duration">{interview.duration}</div>
              </div>
              <div className="interview-info">
                <div className="interview-title">{interview.title}</div>
                <div className="interview-participant">
                  {interview.participant} · {interview.role}
                </div>
                <div className="interview-meta">
                  <span className="interview-date">{interview.date}</span>
                  <span className="interview-focus">{interview.focus}</span>
                </div>
              </div>
              <button
                className={`integrate-toggle ${isIntegrated ? 'on' : 'off'}`}
                onClick={(e) => toggleIntegrated(interview.id, e)}
                title={isIntegrated ? 'Click to exclude from analysis' : 'Click to include in analysis'}
              >
                {isIntegrated ? '✓ Integrated' : '○ Excluded'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Expanded View */}
      {loading && <div className="loading-spinner">Loading transcript…</div>}

      {selected && !loading && (
        <div className="interview-detail">
          <div className="detail-header">
            <h3>{selected.title}</h3>
            <button className="btn-close" onClick={() => { setSelected(null); setPlayVideo(false) }}>✕</button>
          </div>

          {/* Video Embed */}
          <div className="video-container">
            {playVideo ? (
              <iframe
                src={`https://www.youtube.com/embed/${selected.video_id}?autoplay=1`}
                title={selected.title}
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="video-iframe"
              />
            ) : (
              <div
                className="video-placeholder"
                style={{ backgroundImage: `url(https://img.youtube.com/vi/${selected.video_id}/hqdefault.jpg)` }}
                onClick={() => setPlayVideo(true)}
              >
                <div className="big-play">▶</div>
                <div className="video-label">Click to play interview recording</div>
              </div>
            )}
          </div>

          {/* Participant Info */}
          <div className="detail-meta">
            <span>👤 {selected.participant}</span>
            <span>💼 {selected.role}</span>
            <span>🏢 {selected.company_type}</span>
            <span>📅 {selected.date}</span>
            <span>⏱️ {selected.duration}</span>
          </div>

          {/* Key Insights */}
          {selected.key_insights && selected.key_insights.length > 0 && (
            <div className="detail-section">
              <h4>💡 Key Insights</h4>
              <div className="insights-grid">
                {selected.key_insights.map((insight, i) => (
                  <div key={i} className={`insight-chip type-${insight.type}`}>
                    <div className="insight-type">{insight.type}</div>
                    <div className="insight-area">{insight.area}</div>
                    <div className="insight-desc">{insight.description}</div>
                    {insight.action && <div className="insight-action">→ {insight.action}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PM Questions */}
          {selected.pm_questions && selected.pm_questions.length > 0 && (
            <div className="detail-section">
              <h4>❓ PM Research Questions</h4>
              <div className="qa-list">
                {selected.pm_questions.map((qa, i) => (
                  <div key={i} className="qa-item">
                    <div className="qa-q">Q: {qa.question}</div>
                    <div className="qa-a">A: {qa.answer}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Transcript */}
          {selected.transcript && (
            <div className="detail-section">
              <h4>📝 Full Transcript</h4>
              <div className="transcript-viewer">
                <pre>{selected.transcript}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
