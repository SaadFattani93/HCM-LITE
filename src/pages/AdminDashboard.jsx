import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Link } from 'react-router-dom'
import AIDashboardSummary from '../components/AIDashboardSummary'
import AIAssistant from '../components/AIAssistant'
export default function AdminDashboard() {
  const [counts, setCounts] = useState({
    employees: 0,
    departments: 0,
    designations: 0
  })
  const [stats, setStats] = useState({
    headcount: 0,
    totalPayrollCost: 0,
    averageSalary: 0,
    attritionCount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [empRes, deptRes, desRes] = await Promise.all([
        supabase.from('employees').select('*', { count: 'exact', head: true }),
        supabase.from('departments').select('*', { count: 'exact', head: true }),
        supabase.from('designations').select('*', { count: 'exact', head: true })
      ])

      setCounts({
        employees: empRes.count || 0,
        departments: deptRes.count || 0,
        designations: desRes.count || 0
      })

      // Fetch Employees for metrics
      const { data: employees } = await supabase.from('employees').select('*')
      const activeEmps = employees ? employees.filter(e => e.status !== 'Inactive') : []
      const inactiveEmps = employees ? employees.filter(e => e.status === 'Inactive') : []

      // Fetch Payroll for cost & average salary
      const { data: payrolls } = await supabase.from('payroll').select('*')
      const totalCost = payrolls ? payrolls.reduce((acc, curr) => acc + Number(curr.net_salary || 0), 0) : 0
      const avgSalary = activeEmps.length > 0 ? Math.round(activeEmps.reduce((acc, curr) => acc + Number(curr.basic_salary || 0), 0) / activeEmps.length) : 0

      setStats({
        headcount: activeEmps.length,
        totalPayrollCost: totalCost,
        averageSalary: avgSalary,
        attritionCount: inactiveEmps.length
      })
      
    } catch (err) {
      console.error('Error fetching dashboard stats:', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mt-5 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">🚀 Admin Dashboard</h2>
          <p className="text-secondary mb-0">Welcome back, Administrator. Here is your HCM Lite overview.</p>
        </div>
        <button 
          onClick={() => {
            supabase.auth.signOut().then(() => {
              window.location.href = '/'
            })
          }} 
          className="btn btn-outline-danger btn-sm fw-semibold"
        >
          Sign Out
        </button>
      </div>

{/* ✨ AI Dashboard Summary (#20) */}
      <AIDashboardSummary role="Admin" />

      {/* 🤖 AI Assistant Chat Section (#19 & #22) */}
      <div className="row mb-5">
        <div className="col-md-6">
          <AIAssistant role="Admin" />
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 bg-primary text-white p-4">
            <h6 className="text-uppercase small fw-semibold opacity-75">Total Employees</h6>
            <h2 className="display-6 fw-bold my-2">{loading ? '...' : counts.employees}</h2>
            <Link to="/admin/employees" className="text-white text-decoration-none small stretched-link">
              Manage Employees &rarr;
            </Link>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border-0 bg-success text-white p-4">
            <h6 className="text-uppercase small fw-semibold opacity-75">Total Departments</h6>
            <h2 className="display-6 fw-bold my-2">{loading ? '...' : counts.departments}</h2>
            <Link to="/admin/departments" className="text-white text-decoration-none small stretched-link">
              Manage Departments &rarr;
            </Link>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border-0 bg-dark text-white p-4">
            <h6 className="text-uppercase small fw-semibold opacity-75">Total Designations</h6>
            <h2 className="display-6 fw-bold my-2">{loading ? '...' : counts.designations}</h2>
            <Link to="/admin/designations" className="text-white text-decoration-none small stretched-link">
              Manage Designations &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Advanced Executive Metrics Cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div className="card shadow-sm border-0 bg-secondary text-white p-3">
            <h6 className="text-uppercase small fw-semibold opacity-75">Headcount</h6>
            <h4 className="fw-bold my-1">{loading ? '...' : stats.headcount} Active</h4>
            <span className="small opacity-75">Staff Onboarded</span>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-sm border-0 bg-success text-white p-3">
            <h6 className="text-uppercase small fw-semibold opacity-75">Payroll Cost</h6>
            <h4 className="fw-bold my-1">{loading ? '...' : `Rs. ${stats.totalPayrollCost.toLocaleString()}`}</h4>
            <span className="small opacity-75">Total Disbursed</span>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-sm border-0 bg-info text-white p-3">
            <h6 className="text-uppercase small fw-semibold opacity-75">Average Salary</h6>
            <h4 className="fw-bold my-1">{loading ? '...' : `Rs. ${stats.averageSalary.toLocaleString()}`}</h4>
            <span className="small opacity-75">Per Employee</span>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-sm border-0 bg-warning text-dark p-3">
            <h6 className="text-uppercase small fw-semibold opacity-75">Attrition</h6>
            <h4 className="fw-bold my-1">{loading ? '...' : stats.attritionCount}</h4>
            <span className="small">Deactivated Logins</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <h4 className="fw-bold mb-3">Quick Navigation</h4>
      <div className="row g-3">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-3 h-100">
            <h5 className="fw-semibold">🏢 Departments</h5>
            <p className="text-muted small">Add, view, and organize company departments.</p>
            <Link to="/admin/departments" className="btn btn-outline-primary btn-sm mt-auto align-self-start">Go to Departments</Link>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-3 h-100">
            <h5 className="fw-semibold">💼 Designations</h5>
            <p className="text-muted small">Manage job roles and structural titles.</p>
            <Link to="/admin/designations" className="btn btn-outline-primary btn-sm mt-auto align-self-start">Go to Designations</Link>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-4 h-100">
            <h5 className="fw-semibold">⚙️ Company Settings</h5>
            <p className="text-muted small">Office timings, grace period, weekends, aur location radius setup karein.</p>
            <Link to="/admin/settings" className="btn btn-outline-primary btn-sm mt-auto align-self-start">
              Configure Settings &rarr;
            </Link>
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
            <h5 className="fw-semibold">🛡️ System Audit Logs</h5>
            <p className="text-muted small">Administrative aur sensitive system activities ko track aur monitor karein.</p>
            <Link to="/admin/audit-logs" className="btn btn-outline-primary btn-sm mt-auto align-self-start">Open Audit Logs</Link>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-4 h-100">
            <h5 className="fw-semibold">📢 Announcements</h5>
            <p className="text-muted small">Company-wide notices, updates, aur announcements post karein.</p>
            <Link to="/announcements" className="btn btn-outline-primary btn-sm mt-auto align-self-start">
              Post Announcements &rarr;
            </Link>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-3 h-100">
            <h5 className="fw-semibold">👥 Employees</h5>
            <p className="text-muted small">Directory of all staff, salaries, and roles.</p>
            <Link to="/admin/employees" className="btn btn-outline-primary btn-sm mt-auto align-self-start">Go to Employees</Link>
          </div>
        </div>
      </div>
    </div>
  )
}