import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function Payroll() {
  const [employees, setEmployees] = useState([])
  const [payrolls, setPayrolls] = useState([])
  const [selectedMonth, setSelectedMonth] = useState('October 2026')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Payroll Form State
  const [selectedEmpId, setSelectedEmpId] = useState('')
  const [basicSalary, setBasicSalary] = useState(0)
  const [allowances, setAllowances] = useState(0)
  const [deductions, setDeductions] = useState(0)

  useEffect(() => {
    fetchInitialData()
  }, [selectedMonth])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      // 1. Fetch Employees
      const { data: empData } = await supabase.from('employees').select('*')
      setEmployees(empData || [])

      // 2. Fetch Payrolls for selected month
      const { data: payData, error: payError } = await supabase
        .from('payroll')
        .select('*, employees(full_name, employee_code, departments(name))')
        .eq('month', selectedMonth)
        .order('created_at', { ascending: false })

      if (payError) throw payError
      setPayrolls(payData || [])
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Auto-fill basic salary when employee is selected
  const handleEmployeeSelect = (empId) => {
    setSelectedEmpId(empId)
    const emp = employees.find(e => e.id === empId)
    if (emp) {
      setBasicSalary(emp.basic_salary || 0)
    }
  }

  const handleGeneratePayroll = async (e) => {
    e.preventDefault()
    if (!selectedEmpId) return
    setActionLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const netSalary = parseFloat(basicSalary) + parseFloat(allowances || 0) - parseFloat(deductions || 0)

      const { error } = await supabase.from('payroll').insert([
        {
          employee_id: selectedEmpId,
          month: selectedMonth,
          basic_salary: parseFloat(basicSalary),
          allowances: parseFloat(allowances || 0),
          deductions: parseFloat(deductions || 0),
          net_salary: netSalary,
          status: 'Draft'
        }
      ])

      if (error) throw error

      setSuccessMsg('Payroll draft generated successfully!')
      setSelectedEmpId('')
      setAllowances(0)
      setDeductions(0)
      fetchInitialData()
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleFinalizePayroll = async (id) => {
    try {
      const { error } = await supabase
        .from('payroll')
        .update({ status: 'Finalized' })
        .eq('id', id)

      if (error) throw error
      setSuccessMsg('Payroll finalized and locked!')
      fetchInitialData()
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  return (
    <div className="container mt-5 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">💵 Payroll Management</h2>
          <p className="text-secondary mb-0">Generate monthly payroll drafts and finalize salary disbursements.</p>
        </div>
        <div>
          <select 
            className="form-select form-select-sm fw-semibold" 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)}
          >
            <option value="October 2026">October 2026</option>
            <option value="November 2026">November 2026</option>
            <option value="December 2026">December 2026</option>
          </select>
        </div>
      </div>

      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="row g-4">
        {/* Create Payroll Form */}
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-4">
            <h6 className="fw-semibold mb-3">Generate Payroll Draft</h6>
            <form onSubmit={handleGeneratePayroll}>
              <div className="mb-2">
                <label className="form-label text-secondary small">Select Employee</label>
                <select 
                  className="form-select form-select-sm" 
                  value={selectedEmpId} 
                  onChange={e => handleEmployeeSelect(e.target.value)}
                  required
                >
                  <option value="">Choose Employee</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>
                  ))}
                </select>
              </div>

              <div className="mb-2">
                <label className="form-label text-secondary small">Basic Salary (Rs.)</label>
                <input type="number" className="form-control form-control-sm" value={basicSalary} readOnly />
              </div>

              <div className="mb-2">
                <label className="form-label text-secondary small">Allowances (Bonus, Medical, etc.)</label>
                <input 
                  type="number" 
                  className="form-control form-control-sm" 
                  value={allowances} 
                  onChange={e => setAllowances(e.target.value)} 
                />
              </div>

              <div className="mb-2">
                <label className="form-label text-secondary small">Deductions (Tax, Unpaid leaves)</label>
                <input 
                  type="number" 
                  className="form-control form-control-sm" 
                  value={deductions} 
                  onChange={e => setDeductions(e.target.value)} 
                />
              </div>

              <div className="p-2 bg-light rounded text-center my-3">
                <span className="text-muted small d-block">Estimated Net Salary</span>
                <strong className="text-success fs-5">
                  Rs. {(parseFloat(basicSalary || 0) + parseFloat(allowances || 0) - parseFloat(deductions || 0)).toLocaleString()}
                </strong>
              </div>

              <button type="submit" className="btn btn-primary w-100 btn-sm fw-semibold" disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Save Payroll Draft'}
              </button>
            </form>
          </div>
        </div>

        {/* Payroll Records List */}
        <div className="col-md-8">
          <div className="card shadow-sm border-0 p-4">
            <h6 className="fw-semibold mb-3">Payroll Sheet - {selectedMonth}</h6>
            <div className="table-responsive">
              <table className="table table-hover align-middle small">
                <thead className="table-light">
                  <tr>
                    <th>Employee</th>
                    <th>Basic</th>
                    <th>Allowances</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="7" className="text-center py-4">Loading payroll records...</td></tr>
                  ) : payrolls.length > 0 ? (
                    payrolls.map(pay => (
                      <tr key={pay.id}>
                        <td>
                          <strong>{pay.employees?.full_name}</strong><br/>
                          <span className="text-muted small">{pay.employees?.employee_code}</span>
                        </td>
                        <td>Rs. {pay.basic_salary}</td>
                        <td className="text-success">+Rs. {pay.allowances}</td>
                        <td className="text-danger">-Rs. {pay.deductions}</td>
                        <td className="fw-bold">Rs. {pay.net_salary}</td>
                        <td>
                          <span className={`badge ${pay.status === 'Finalized' ? 'bg-success' : 'bg-warning text-dark'}`}>
                            {pay.status}
                          </span>
                        </td>
                        <td>
                          {pay.status === 'Draft' ? (
                            <button 
                              onClick={() => handleFinalizePayroll(pay.id)} 
                              className="btn btn-sm btn-outline-success py-0"
                            >
                              Finalize
                            </button>
                          ) : (
                            <span className="text-muted small">Locked 🔒</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="7" className="text-center text-muted py-4">No payroll records generated for {selectedMonth}.</td></tr>
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