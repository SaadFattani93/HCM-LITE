import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function HRAttendanceCorrections() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchCorrections()
  }, [])

  const fetchCorrections = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('attendance_corrections')
        .select(`
          *,
          employees:employee_id (
            full_name,
            employee_code,
            departments (name)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('attendance_corrections')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      fetchCorrections()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="container mt-5 mb-5">
      <h2 className="fw-bold mb-3">⏱️ Attendance Correction Requests</h2>
      <p className="text-secondary mb-4">Review and approve or reject employee attendance correction submissions.</p>

      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

      <div className="card shadow-sm border-0 p-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle small">
            <thead className="table-light">
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Requested Times</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-4">Loading requests...</td></tr>
              ) : requests.length > 0 ? (
                requests.map(req => {
                  const st = req.status ? req.status.toLowerCase() : ''
                  return (
                    <tr key={req.id}>
                      <td>
                        <strong>{req.employees?.full_name}</strong><br/>
                        <span className="text-muted small">{req.employees?.employee_code}</span>
                      </td>
                      <td>{req.attendance_date}</td>
                      <td>
                        In: {req.requested_check_in || 'N/A'}<br/>
                        Out: {req.requested_check_out || 'N/A'}
                      </td>
                      <td className="text-muted">{req.reason}</td>
                      <td>
                        <span className={`badge ${
                          st === 'approved' ? 'bg-success' :
                          st === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        {st === 'pending' ? (
                          <div className="btn-group btn-group-sm">
                            <button onClick={() => handleUpdateStatus(req.id, 'Approved')} className="btn btn-success">Approve</button>
                            <button onClick={() => handleUpdateStatus(req.id, 'Rejected')} className="btn btn-outline-danger">Reject</button>
                          </div>
                        ) : (
                          <span className="text-muted small">Processed</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr><td colSpan="6" className="text-center text-muted py-4">No attendance correction requests found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}