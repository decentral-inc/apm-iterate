import { useState, useEffect } from 'react'
import { mockConnectCrm, type Stats } from '../api/client'

interface Props {
  onConnected: (stats: Stats) => void
}

type Step = 'choose' | 'authenticating' | 'importing' | 'complete'

const STEPS: { key: Step; label: string; icon: string }[] = [
  { key: 'choose', label: 'Select CRM', icon: '1' },
  { key: 'authenticating', label: 'Authenticate', icon: '2' },
  { key: 'importing', label: 'Import Data', icon: '3' },
  { key: 'complete', label: 'Ready', icon: '4' },
]

export default function ConnectScreen({ onConnected }: Props) {
  const [step, setStep] = useState<Step>('choose')
  const [selectedCrm, setSelectedCrm] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [importProgress, setImportProgress] = useState(0)

  const startConnection = async (crm: string) => {
    setSelectedCrm(crm)
    setError(null)

    // Step 1: Authenticating
    setStep('authenticating')
    await new Promise(r => setTimeout(r, 1800))

    // Step 2: Importing
    setStep('importing')
    try {
      // Simulate progress while real API call happens
      const progressInterval = setInterval(() => {
        setImportProgress(p => Math.min(p + 8, 90))
      }, 200)

      const result = await mockConnectCrm()
      clearInterval(progressInterval)
      setImportProgress(100)
      setStats(result.stats)

      // Step 3: Complete
      await new Promise(r => setTimeout(r, 600))
      setStep('complete')
    } catch (e: any) {
      setError(e.message)
      setStep('choose')
    }
  }

  const stepIndex = STEPS.findIndex(s => s.key === step)

  return (
    <div className="connect-screen">
      <div className="connect-card">
        <div className="connect-logo">
          <span className="logo-icon">🧠</span>
          <h1>APM</h1>
          <p className="connect-subtitle">Connect your CRM to unlock AI-powered insights, meeting briefs, and growth recommendations.</p>
        </div>

        {/* Progress Steps */}
        <div className="connect-steps">
          {STEPS.map((s, i) => (
            <div key={s.key} className={`connect-step ${i < stepIndex ? 'done' : ''} ${i === stepIndex ? 'active' : ''}`}>
              <div className="step-circle">
                {i < stepIndex ? '✓' : s.icon}
              </div>
              <span className="step-label">{s.label}</span>
              {i < STEPS.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 'choose' && (
          <div className="connect-choose">
            <h2>Connect Your CRM</h2>
            <p>Choose your CRM provider to import user data and begin analysis.</p>
            <div className="crm-options">
              <button className="crm-btn" onClick={() => startConnection('salesforce')}>
                <span className="crm-logo">☁️</span>
                <span className="crm-name">Salesforce</span>
                <span className="crm-desc">Import contacts, deals & activity</span>
              </button>
              <button className="crm-btn" onClick={() => startConnection('hubspot')}>
                <span className="crm-logo">🟠</span>
                <span className="crm-name">HubSpot</span>
                <span className="crm-desc">Import contacts, companies & engagement</span>
              </button>
            </div>
            <p className="connect-note">Demo mode — uses synthetic data for testing.</p>
          </div>
        )}

        {step === 'authenticating' && (
          <div className="connect-status">
            <div className="status-spinner" />
            <h2>Authenticating with {selectedCrm === 'salesforce' ? 'Salesforce' : 'HubSpot'}...</h2>
            <p>Establishing secure OAuth 2.0 connection</p>
            <div className="auth-steps">
              <div className="auth-step done">✓ Redirect to {selectedCrm} login</div>
              <div className="auth-step active">⏳ Exchanging authorization token</div>
              <div className="auth-step">○ Verifying permissions</div>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="connect-status">
            <h2>Importing Data</h2>
            <p>Syncing contacts, companies, and engagement data...</p>
            <div className="import-progress">
              <div className="import-bar">
                <div className="import-fill" style={{ width: `${importProgress}%` }} />
              </div>
              <span className="import-pct">{importProgress}%</span>
            </div>
            <div className="import-details">
              <div className="import-item">📇 Contacts & Leads</div>
              <div className="import-item">🏢 Company Profiles</div>
              <div className="import-item">📊 Engagement History</div>
              <div className="import-item">🏷️ Tags & Segments</div>
            </div>
          </div>
        )}

        {step === 'complete' && stats && (
          <div className="connect-status">
            <div className="complete-check">✓</div>
            <h2>Data Integration Complete</h2>
            <p>{selectedCrm === 'salesforce' ? 'Salesforce' : 'HubSpot'} connected successfully</p>
            <div className="import-summary">
              <div className="summary-stat">
                <span className="summary-value">{stats.total}</span>
                <span className="summary-label">Total Records</span>
              </div>
              <div className="summary-stat">
                <span className="summary-value" style={{ color: 'var(--success)' }}>{stats.signed_up}</span>
                <span className="summary-label">Active Users</span>
              </div>
              <div className="summary-stat">
                <span className="summary-value" style={{ color: 'var(--warning)' }}>{stats.not_engaged}</span>
                <span className="summary-label">Leads</span>
              </div>
              <div className="summary-stat">
                <span className="summary-value">{Object.keys(stats.by_source).length}</span>
                <span className="summary-label">Sources</span>
              </div>
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => onConnected(stats)}>
              🚀 Launch Dashboard
            </button>
          </div>
        )}

        {error && <p className="connect-error">⚠️ {error}</p>}
      </div>
    </div>
  )
}
