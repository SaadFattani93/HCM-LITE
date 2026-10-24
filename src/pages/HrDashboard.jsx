import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Link } from 'react-router-dom'

export default function HRDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayPresent: 0,
    pendingLeaves: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHRStats()
  }, [])

  const fetchHRStats = async () => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]

      const { count: empCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', today)

      const { count: leaveCount } = await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending')

      setStats({
        totalEmployees: empCount || 0,
        todayPresent: attendanceData ? attendanceData.length : 0,
        pendingLeaves: leaveCount || 0
      })
    } catch (err) {
      console.error('Error fetching HR stats:', err.message)
    } finally {
      setLoading(false)
    }
    
  }

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">👔 HR Dashboard</h2>
          <p className="text-secondary mb-0">Daily operations, attendance tracking, and leave approvals.</p>
        </div>
        <button 
          onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')} 
          className="btn btn-outline-danger btn-sm fw-semibold"
        >
          Sign Out
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 bg-primary text-white p-4">
            <h6 className="text-uppercase small fw-semibold opacity-75">Total Employees</h6>
            <h2 className="display-6 fw-bold my-2">{loading ? '...' : stats.totalEmployees}</h2>
            <Link to="/admin/employees" className="text-white text-decoration-none small stretched-link">
              View Directory &rarr;
            </Link>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border-0 bg-success text-white p-4">
            <h6 className="text-uppercase small fw-semibold opacity-75">Today Present</h6>
            <h2 className="display-6 fw-bold my-2">{loading ? '...' : stats.todayPresent}</h2>
            <Link to="/hr/attendance" className="text-white text-decoration-none small stretched-link">
              Attendance Board &rarr;
            </Link>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border-0 bg-warning text-dark p-4">
            <h6 className="text-uppercase small fw-semibold opacity-75">Pending Leave Requests</h6>
            <h2 className="display-6 fw-bold my-2">{loading ? '...' : stats.pendingLeaves}</h2>
            <Link to="/hr/leaves" className="text-dark text-decoration-none small stretched-link">
              Review Leaves &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h4 className="fw-bold mb-3">HR Management Actions</h4>
      <div className="row g-3">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-4 h-100">
            <h5 className="fw-semibold">👥 Employees</h5>
            <p className="text-muted small">Naye employees register karein aur directory check karein.</p>
            <Link to="/admin/employees" className="btn btn-outline-primary btn-sm mt-auto align-self-start">Manage Employees</Link>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-4 h-100">
            <h5 className="fw-semibold">📊 Attendance Board</h5>
            <p className="text-muted small">Real-time check-in timings aur attendance monitor karein.</p>
            <Link to="/hr/attendance" className="btn btn-outline-primary btn-sm mt-auto align-self-start">Open Attendance</Link>
          </div>
        </div>
<div className="col-md-4">
  <div className="card shadow-sm border-0 p-4 h-100">
    <h5 className="fw-semibold">💵 Payroll</h5>
    <p className="text-muted small">Monthly salary drafts generate aur finalize karein.</p>
    <Link to="/hr/payroll" className="btn btn-outline-primary btn-sm mt-auto align-self-start">Manage Payroll</Link>
  </div>
</div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-4 h-100">
            <h5 className="fw-semibold">🌴 Leave Approvals</h5>
            <p className="text-muted small">Employees ki leave applications approve ya reject karein.</p>
            <Link to="/hr/leaves" className="btn btn-outline-primary btn-sm mt-auto align-self-start">Open Leave Board</Link>
          </div>
        </div>
      </div>
    </div>
  )
}