import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import AIAssistant from '../components/AIAssistant'
import SmartLeaveInput from '../components/SmartLeaveInput'
export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState(null)
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [myLeaves, setMyLeaves] = useState([])
  const [myPayrolls, setMyPayrolls] = useState([])
  const [corrections, setCorrections] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Profile Edit State
  const [editingProfile, setEditingProfile] = useState(false)
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  // Password Change Stateleave
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [passMsg, setPassMsg] = useState({ type: '', text: '' })

  // Correction Form State
  const [corrDate, setCorrDate] = useState('')
  const [checkInTime, setCheckInTime] = useState('')
  const [checkOutTime, setCheckOutTime] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // Leave Form State
  const [leaveData, setLeaveData] = useState({
    leave_type: 'Annual',
    start_date: '',
    end_date: '',
    reason: ''
  })

  useEffect(() => {
    fetchEmployeeAndData()
  }, [])

  const fetchEmployeeAndData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No active user session')

      // Fetch Employee Profile
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('*, departments(name), designations(title)')
        .eq('user_id', user.id)
        .single()

      if (empError) throw empError
      setEmployee(empData)
      setPhone(empData.phone || '')
      setAddress(empData.address || '')

      // Check if First Time Login
      if (empData.is_first_login) {
        setShowPasswordModal(true)
      }

      // Fetch Today Attendance
      const today = new Date().toISOString().split('T')[0]
      const { data: attData } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', empData.id)
        .eq('date', today)
        .maybeSingle()

      setTodayAttendance(attData)

      // Fetch Employee's Leave History
      const { data: leaveList } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', empData.id)
        .order('created_at', { ascending: false })

      setMyLeaves(leaveList || [])

      // Fetch Employee's Finalized Payrolls (Payslips)
      const { data: payList } = await supabase
        .from('payroll')
        .select('*')
        .eq('employee_id', empData.id)
        .eq('status', 'Finalized')
        .order('created_at', { ascending: false })

      setMyPayrolls(payList || [])

      // Fetch Employee's Correction History
      const { data: corrList } = await supabase
        .from('attendance_corrections')
        .select('*')
        .eq('employee_id', empData.id)
        .order('created_at', { ascending: false })

      setCorrections(corrList || [])

    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Profile Edit Handler (Phone & Address Update)
  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const { error } = await supabase
        .from('employees')
        .update({ phone, address })
        .eq('id', employee.id)

      if (error) throw error

      setSuccessMsg('Profile contact info updated successfully!')
      setEditingProfile(false)
      fetchEmployeeAndData()
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Password Change Handler (First-Time or Manual)
  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPassMsg({ type: '', text: '' })

    try {
      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long.')
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      // Update is_first_login to false
      await supabase
        .from('employees')
        .update({ is_first_login: false })
        .eq('id', employee.id)

      setPassMsg({ type: 'success', text: 'Password updated successfully! 🎉' })
      setTimeout(() => {
        setShowPasswordModal(false)
        setNewPassword('')
        fetchEmployeeAndData()
      }, 1500)
    } catch (err) {
      setPassMsg({ type: 'danger', text: err.message })
    }
  }

  const handleCheckIn = async () => {
    if (!employee) return
    setActionLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const currentTime = new Date().toISOString()

      const { error } = await supabase.from('attendance').insert([
        {
          employee_id: employee.id,
          date: today,
          check_in_time: currentTime,
          status: 'present'
        }
      ])
      if (error) throw error
      setSuccessMsg('Checked in successfully!')
      fetchEmployeeAndData()
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (!todayAttendance) return
    setActionLoading(true)
    try {
      const currentTime = new Date().toISOString()
      const { error } = await supabase
        .from('attendance')
        .update({ check_out_time: currentTime })
        .eq('id', todayAttendance.id)

      if (error) throw error
      setSuccessMsg('Checked out successfully!')
      fetchEmployeeAndData()
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleApplyLeave = async (e) => {
    e.preventDefault()
    if (!employee) return
    setActionLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const { error } = await supabase.from('leave_requests').insert([
        {
          employee_id: employee.id,
          leave_type: leaveData.leave_type,
          start_date: leaveData.start_date,
          end_date: leaveData.end_date,
          reason: leaveData.reason,
          status: 'Pending'
        }
      ])

      if (error) throw error

      setSuccessMsg('Leave request submitted successfully!')
      setLeaveData({ leave_type: 'Annual', start_date: '', end_date: '', reason: '' })
      fetchEmployeeAndData()
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault()
    if (!employee) return
    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const { error } = await supabase.from('attendance_corrections').insert([
        {
          employee_id: employee.id,
          attendance_date: corrDate,
          requested_check_in: checkInTime || null,
          requested_check_out: checkOutTime || null,
          reason: reason,
          status: 'Pending'
        }
      ])

      if (error) throw error

      setSuccessMsg('Attendance correction request submitted successfully!')
      setCorrDate('')
      setCheckInTime('')
      setCheckOutTime('')
      setReason('')
      fetchEmployeeAndData()
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="container mt-5 text-center">Loading portal...</div>

  return (
    <div className="container mt-5 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">👋 Welcome, {employee?.full_name || 'Employee'}</h2>
          <p className="text-secondary mb-0">Employee Self-Service Portal</p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={() => setShowPasswordModal(true)} className="btn btn-outline-primary btn-sm fw-semibold">
            🔑 Change Password
          </button>
          <button 
            onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')} 
            className="btn btn-outline-danger btn-sm fw-semibold"
          >
            Sign Out
          </button>
        </div>
      </div>

      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {/* Password Change / First Time Login Modal */}
      {showPasswordModal && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">🔐 {employee?.is_first_login ? 'First-Time Password Setup' : 'Change Password'}</h5>
                {!employee?.is_first_login && (
                  <button type="button" className="btn-close" onClick={() => setShowPasswordModal(false)}></button>
                )}
              </div>
              <form onSubmit={handleChangePassword}>
                <div className="modal-body">
                  {employee?.is_first_login && (
                    <p className="text-muted small">Welcome! Since this is your first sign-in, please update your temporary password for security.</p>
                  )}
                  {passMsg.text && <div className={`alert alert-${passMsg.type}`}>{passMsg.text}</div>}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">New Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="At least 6 characters" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary w-100 fw-semibold">Save New Password</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
{/* 🤖 AI Assistant Chat Component (#19) */}
      <div className="mb-5">
        <AIAssistant role="Employee" empId={employee?.id} />
      </div>
      <div className="row g-4 mb-5">
        {/* Profile Card */}
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-semibold mb-0">My Profile</h5>
              <button 
                onClick={() => setEditingProfile(!editingProfile)} 
                className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold"
              >
                {editingProfile ? 'Cancel' : '✏️ Edit Contact'}
              </button>
            </div>

            {editingProfile ? (
              <form onSubmit={handleProfileUpdate}>
                <div className="mb-2">
                  <label className="form-label text-secondary small">Phone Number</label>
                  <input type="text" className="form-control form-control-sm" placeholder="e.g. +92 300 1234567" value={phone} onChange={e => setPhone(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label text-secondary small">Address</label>
                  <textarea className="form-control form-control-sm" rows="2" placeholder="Residential Address..." value={address} onChange={e => setAddress(e.target.value)} required></textarea>
                </div>
                <button type="submit" className="btn btn-sm btn-primary w-100 fw-semibold" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            ) : (
              <>
                <p className="mb-1 text-muted small">Code: <strong className="text-dark">{employee?.employee_code}</strong></p>
                <p className="mb-1 text-muted small">Email: <strong className="text-dark">{employee?.email}</strong></p>
                <p className="mb-1 text-muted small">Phone: <strong className="text-dark">{employee?.phone || 'Not set'}</strong></p>
                <p className="mb-1 text-muted small">Address: <strong className="text-dark">{employee?.address || 'Not set'}</strong></p>
                <p className="mb-1 text-muted small">Department: <strong className="text-dark">{employee?.departments?.name || 'N/A'}</strong></p>
                <p className="mb-1 text-muted small">Designation: <strong className="text-dark">{employee?.designations?.title || 'N/A'}</strong></p>
                <p className="mb-0 text-muted small">Salary: <strong className="text-dark">Rs. {employee?.basic_salary}</strong></p>
              </>
            )}
          </div>
        </div>

        {/* Daily Attendance Card */}
        <div className="col-md-8">
          <div className="card shadow-sm border-0 p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <h5 className="fw-semibold mb-3">⏱️ Daily Attendance</h5>
              <p className="text-muted small">Mark attendance for: <strong>{new Date().toLocaleDateString()}</strong></p>
            </div>

            <div className="p-4 bg-light rounded text-center my-2">
              {!todayAttendance ? (
                <button onClick={handleCheckIn} className="btn btn-success px-4 py-2 fw-semibold" disabled={actionLoading}>
                  {actionLoading ? 'Processing...' : '🟢 Check In Now'}
                </button>
              ) : (
                <div>
                  <div className="row mb-3">
                    <div className="col-6 border-end">
                      <span className="text-muted small d-block">Check-In</span>
                      <strong className="text-success fs-6">{todayAttendance.check_in_time ? new Date(todayAttendance.check_in_time).toLocaleTimeString() : 'N/A'}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted small d-block">Check-Out</span>
                      <strong className="text-danger fs-6">{todayAttendance.check_out_time ? new Date(todayAttendance.check_out_time).toLocaleTimeString() : 'Not Checked Out'}</strong>
                    </div>
                  </div>
                  {!todayAttendance.check_out_time ? (
                    <button onClick={handleCheckOut} className="btn btn-danger px-4 py-2 fw-semibold" disabled={actionLoading}>
                      {actionLoading ? 'Processing...' : '🔴 Check Out Now'}
                    </button>
                  ) : (
                    <div className="badge bg-primary p-2 fs-6">Attendance Completed ✅</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Corrections Section */}
      <h4 className="fw-bold mb-3">⏱️ Attendance Corrections</h4>
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-4 h-100">
            <h6 className="fw-semibold mb-3">Request Timing Correction</h6>
            <form onSubmit={handleCorrectionSubmit}>
              <div className="mb-2">
                <label className="form-label text-secondary small">Attendance Date</label>
                <input type="date" className="form-control form-control-sm" value={corrDate} onChange={e => setCorrDate(e.target.value)} required />
              </div>
              <div className="mb-2">
                <label className="form-label text-secondary small">Requested Check-In</label>
                <input type="time" className="form-control form-control-sm" value={checkInTime} onChange={e => setCheckInTime(e.target.value)} />
              </div>
              <div className="mb-2">
                <label className="form-label text-secondary small">Requested Check-Out</label>
                <input type="time" className="form-control form-control-sm" value={checkOutTime} onChange={e => setCheckOutTime(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label text-secondary small">Reason</label>
                <textarea className="form-control form-control-sm" rows="2" placeholder="Reason for correction..." value={reason} onChange={e => setReason(e.target.value)} required></textarea>
              </div>
              <button type="submit" className="btn btn-primary w-100 btn-sm fw-semibold" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Correction'}
              </button>
            </form>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card shadow-sm border-0 p-4 h-100">
            <h6 className="fw-semibold mb-3">My Correction Requests History</h6>
            <div className="table-responsive">
              <table className="table table-hover align-middle small">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Requested Times</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {corrections.length > 0 ? (
                    corrections.map(item => (
                      <tr key={item.id}>
                        <td className="fw-semibold">{item.attendance_date}</td>
                        <td>In: {item.requested_check_in || 'N/A'}<br/>Out: {item.requested_check_out || 'N/A'}</td>
                        <td className="text-muted">{item.reason}</td>
                        <td>
                          <span className={`badge ${
                            item.status === 'Approved' ? 'bg-success' :
                            item.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="text-center text-muted py-4">No correction requests found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Payslips / Finalized Payroll Section */}
      <h4 className="fw-bold mb-3">💰 My Payslips (Salary Disbursements)</h4>
      <div className="card shadow-sm border-0 p-4 mb-5">
        <div className="table-responsive">
          <table className="table table-hover align-middle small">
            <thead className="table-light">
              <tr>
                <th>Month</th>
                <th>Basic Salary</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myPayrolls.length > 0 ? (
                myPayrolls.map(pay => (
                  <tr key={pay.id}>
                    <td className="fw-bold text-primary">{pay.month}</td>
                    <td>Rs. {pay.basic_salary}</td>
                    <td className="text-success">+Rs. {pay.allowances}</td>
                    <td className="text-danger">-Rs. {pay.deductions}</td>
                    <td className="fw-bold fs-6 text-dark">Rs. {pay.net_salary}</td>
                    <td>
                      <span className="badge bg-success">Finalized & Locked 🔒</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">No finalized payslips available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Management Section */}
      <h4 className="fw-bold mb-3">🌴 Leave Management</h4>
      <div className="row g-4">
        {/* Apply Leave Form */}
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-4">
            <h6 className="fw-semibold mb-3">Request Leave</h6>
            {/* ✨ Smart Leave Prompt Input (#21) */}
            <SmartLeaveInput onParseComplete={(parsed) => setLeaveData(parsed)} />
            <form onSubmit={handleApplyLeave}>
              <div className="mb-2">
                <label className="form-label text-secondary small">Leave Type</label>
                <select className="form-select form-select-sm" value={leaveData.leave_type} onChange={e => setLeaveData({...leaveData, leave_type: e.target.value})}>
                  <option value="Annual">Annual</option>
                  <option value="Sick">Sick</option>
                  <option value="Casual">Casual</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>

              <div className="mb-2">
                <label className="form-label text-secondary small">Start Date</label>
                <input type="date" className="form-control form-control-sm" value={leaveData.start_date} onChange={e => setLeaveData({...leaveData, start_date: e.target.value})} required />
              </div>

              <div className="mb-2">
                <label className="form-label text-secondary small">End Date</label>
                <input type="date" className="form-control form-control-sm" value={leaveData.end_date} onChange={e => setLeaveData({...leaveData, end_date: e.target.value})} required />
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small">Reason</label>
                <textarea className="form-control form-control-sm" rows="2" placeholder="Reason for leave..." value={leaveData.reason} onChange={e => setLeaveData({...leaveData, reason: e.target.value})} required></textarea>
              </div>

              <button type="submit" className="btn btn-primary w-100 btn-sm fw-semibold" disabled={actionLoading}>
                {actionLoading ? 'Submitting...' : 'Submit Leave Request'}
              </button>
            </form>
          </div>
        </div>

        {/* Leave Requests History */}
        <div className="col-md-8">
          <div className="card shadow-sm border-0 p-4">
            <h6 className="fw-semibold mb-3">My Leave Applications</h6>
            <div className="table-responsive">
              <table className="table table-hover align-middle small">
                <thead className="table-light">
                  <tr>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myLeaves.length > 0 ? (
                    myLeaves.map(leave => {
                      const st = leave.status ? leave.status.toLowerCase() : ''
                      return (
                        <tr key={leave.id}>
                          <td className="fw-semibold">{leave.leave_type}</td>
                          <td>{leave.start_date} to {leave.end_date}</td>
                          <td className="text-muted">{leave.reason}</td>
                          <td>
                            <span className={`badge ${
                              st === 'approved' ? 'bg-success' :
                              st === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'
                            }`}>
                              {leave.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">No leave requests found.</td>
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