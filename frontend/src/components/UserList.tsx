import { useState, useEffect } from 'react'
import { fetchUsers, type CrmUser } from '../api/client'

interface Props {
  visible: boolean
  onClose: () => void
}

export default function UserList({ visible, onClose }: Props) {
  const [users, setUsers] = useState<CrmUser[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<CrmUser | null>(null)

  useEffect(() => {
    if (visible && users.length === 0) {
      setLoading(true)
      fetchUsers()
        .then(r => setUsers(r.users))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [visible])

  if (!visible) return null

  const filtered = users.filter(u =>
    `${u.name} ${u.email} ${u.company} ${u.role}`.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="user-list-overlay" onClick={onClose}>
      <div className="user-list-modal" onClick={e => e.stopPropagation()}>
        <div className="user-list-header">
          <h3>👥 User Directory ({users.length})</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <input
          className="user-search"
          type="text"
          placeholder="Search by name, email, company, role..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div className="spinner" />
          </div>
        ) : (
          <div className="user-list-body">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map(u => (
                  <tr
                    key={u.id}
                    className={`user-row ${selectedUser?.id === u.id ? 'selected' : ''}`}
                    onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
                  >
                    <td>
                      <div className="user-name">{u.name}</div>
                      <div className="user-email">{u.email}</div>
                    </td>
                    <td>
                      <div>{u.company}</div>
                      <div className="user-meta">{u.company_size} employees</div>
                    </td>
                    <td>{u.role}</td>
                    <td>
                      <span className={`status-badge ${u.status}`}>
                        {u.status === 'signed_up' ? '✓ Signed Up' : '○ Not Engaged'}
                      </span>
                    </td>
                    <td>
                      <span className="source-badge">{u.source}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 50 && (
              <p className="user-more">Showing 50 of {filtered.length} results</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
