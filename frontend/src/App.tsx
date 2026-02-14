import { useState } from 'react'
import ConnectScreen from './components/ConnectScreen'
import Dashboard from './components/Dashboard'
import type { Stats } from './api/client'

export default function App() {
  const [connected, setConnected] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)

  if (!connected) {
    return (
      <ConnectScreen
        onConnected={(s) => {
          setStats(s)
          setConnected(true)
        }}
      />
    )
  }

  return <Dashboard initialStats={stats!} />
}
