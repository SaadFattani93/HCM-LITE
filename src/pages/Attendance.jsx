import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function Attendance() {
  const [employees, setEmployees] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [selectedEmp, setSelectedEmp] = useState('')
  const [status, setStatus] = useState('Present')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchEmployees()
    fetchAttendance()
  }, [])

  const fetchEmployees = async () => {
    const { data } = await supabase.from('employees').select('id, full_name, employee_code')
    setEmployees(data || [])
  }

  const fetchAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*, employees(full_name, employee_code)')
        .order('date', { ascending: false })

      if (error) throw error
      setAttendanceRecords(data || [])
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  const handleMarkAttendance = async (e) => {
    e.preventDefault()
    if (!selectedEmp) return

    setLoading(true)
    setErrorMsg('')

    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false })

    try {
      const { error } = await supabase.from('attendance').insert([
        {
          employee_id: selectedEmp,
          date: new Date().toISOString().split('T')[0],
          check_in: currentTime,
          status: status
        }
      ])

      if (error) throw error

      setSelectedEmp('')
      fetchAttendance()
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mt-5">
      <h2 className="fw-bold mb-4">⏱️ Attendance Management</h2>

      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

      <div className="row">
        {/* Mark Attendance Form */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm border-0 p-4">
            <h5 className="fw-semibold mb-3">Mark Today's Attendance</h5>
            <form onSubmit={handleMarkAttendance}>
              <div className="mb-3">
                <label className="form-label text-secondary small">Select Employee</label>
                <select 
                  className="form-select"
                  value={selectedEmp}
                  onChange={(e) => setSelectedEmp(e.target.value)}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small">Status</label>
                <select 
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary w-100 fw-semibold" disabled={loading}>
                {loading ? 'Marking...' : 'Mark Attendance'}
              </button>
            </form>
          </div>
        </div>

        {/* Attendance Log Table */}
        <div className="col-md-8">
          <div className="card shadow-sm border-0 p-4">
            <h5 className="fw-semibold mb-3">Attendance History</h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle small">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Employee</th>
                    <th>Check In</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.length > 0 ? (
                    attendanceRecords.map((rec) => (
                      <tr key={rec.id}>
                        <td>{rec.date}</td>
                        <td className="fw-semibold">{rec.employees?.full_name} ({rec.employees?.employee_code})</td>
                        <td>{rec.check_in || 'N/A'}</td>
                        <td>
                          <span className={`badge ${
                            rec.status === 'Present' ? 'bg-success' :
                            rec.status === 'Late' ? 'bg-warning text-dark' :
                            rec.status === 'Absent' ? 'bg-danger' : 'bg-info text-dark'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">No attendance marked yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}