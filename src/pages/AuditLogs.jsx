import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setLogs(data || [])
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mt-5 mb-5">
      <h2 className="fw-bold mb-3">🛡️ System Audit Logs</h2>
      <p className="text-secondary mb-4">Track administrative and sensitive system activities for security compliance.</p>

      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

      <div className="card shadow-sm border-0 p-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle small">
            <thead className="table-light">
              <tr>
                <th>Timestamp</th>
                <th>Action Performed</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" className="text-center py-4">Loading audit logs...</td></tr>
              ) : logs.length > 0 ? (
                logs.map(log => (
                  <tr key={log.id}>
                    <td className="text-muted">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="fw-bold text-dark">{log.action}</td>
                    <td>{log.details || 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="3" className="text-center text-muted py-4">No audit logs recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}