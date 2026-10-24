import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function HRAttendanceBoard() {
  const [attendanceLogs, setAttendanceLogs] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchDailyAttendance(selectedDate)
  }, [selectedDate])

  const fetchDailyAttendance = async (dateStr) => {
    try {
      setLoading(true)
      setErrorMsg('')

      const { data, error } = await supabase
        .from('attendance')
        .select('*, employees(full_name, employee_code, departments(name), designations(title))')
        .eq('date', dateStr)
        .order('check_in_time', { ascending: true })

      if (error) throw error
      setAttendanceLogs(data || [])
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">📊 HR Daily Attendance Board</h2>
          <p className="text-secondary mb-0">Monitor real-time employee check-ins and attendance statuses.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <label className="fw-semibold small text-secondary">Filter Date:</label>
          <input 
            type="date" 
            className="form-control form-control-sm"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

      <div className="card shadow-sm border-0 p-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle small">
            <thead className="table-light">
              <tr>
                <th>Code</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Check-In Time</th>
                <th>Check-Out Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">Loading attendance logs...</td>
                </tr>
              ) : attendanceLogs.length > 0 ? (
                attendanceLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="fw-bold">{log.employees?.employee_code || 'N/A'}</td>
                    <td className="fw-semibold">{log.employees?.full_name || 'N/A'}</td>
                    <td>{log.employees?.departments?.name || 'N/A'}</td>
                    <td>{log.employees?.designations?.title || 'N/A'}</td>
                    <td className="text-success fw-semibold">
                      {log.check_in_time ? new Date(log.check_in_time).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="text-danger fw-semibold">
                      {log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString() : 'Not Checked Out'}
                    </td>
                    <td>
                      <span className={`badge ${
                        log.status === 'present' ? 'bg-success' :
                        log.status === 'late' ? 'bg-warning text-dark' :
                        log.status === 'absent' ? 'bg-danger' : 'bg-secondary'
                      }`}>
                        {log.status?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    No attendance records found for {selectedDate}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}