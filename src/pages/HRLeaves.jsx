import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function HRLeaves() {
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [comment, setComment] = useState('')
  const [activeLeaveId, setActiveLeaveId] = useState(null)

  useEffect(() => {
    fetchLeaves()
  }, [])

  const fetchLeaves = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('leave_requests')
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
      setLeaves(data || [])
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status: newStatus, hr_comment: comment })
        .eq('id', id)

      if (error) throw error
      setComment('')
      setActiveLeaveId(null)
      fetchLeaves()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="container mt-5 mb-5">
      <h2 className="fw-bold mb-4">📋 HR Leave Approval Board</h2>

      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

      <div className="card shadow-sm border-0 p-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle small">
            <thead className="table-light">
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status / Comment</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-4">Loading requests...</td></tr>
              ) : leaves.length > 0 ? (
                leaves.map(leave => {
                  const currentStatus = leave.status ? leave.status.toLowerCase() : ''
                  const isPending = currentStatus === 'pending'

                  return (
                    <tr key={leave.id}>
                      <td>
                        <strong>{leave.employees?.full_name}</strong><br/>
                        <span className="text-muted small">{leave.employees?.employee_code} ({leave.employees?.departments?.name || 'N/A'})</span>
                      </td>
                      <td className="fw-semibold">{leave.leave_type}</td>
                      <td>{leave.start_date} to {leave.end_date}</td>
                      <td className="text-muted">{leave.reason}</td>
                      <td>
                        <span className={`badge mb-1 ${
                          currentStatus === 'approved' ? 'bg-success' :
                          currentStatus === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'
                        }`}>
                          {leave.status?.toUpperCase()}
                        </span>
                        {leave.hr_comment && <div className="text-muted small">Note: {leave.hr_comment}</div>}
                      </td>
                      <td>
                        {isPending ? (
                          <div>
                            {activeLeaveId === leave.id ? (
                              <div className="d-flex flex-column gap-2">
                                <input 
                                  type="text" 
                                  className="form-control form-control-sm" 
                                  placeholder="Add HR comment..." 
                                  value={comment} 
                                  onChange={e => setComment(e.target.value)} 
                                />
                                <div className="btn-group btn-group-sm">
                                  <button onClick={() => handleUpdateStatus(leave.id, 'Approved')} className="btn btn-success">Confirm Approve</button>
                                  <button onClick={() => handleUpdateStatus(leave.id, 'Rejected')} className="btn btn-danger">Confirm Reject</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => setActiveLeaveId(leave.id)} className="btn btn-sm btn-outline-primary">
                                Review & Comment
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted small">Processed</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr><td colSpan="6" className="text-center text-muted py-4">No leave requests found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}