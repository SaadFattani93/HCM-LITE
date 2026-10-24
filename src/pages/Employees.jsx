import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [designations, setDesignations] = useState([])
  const fileInputRef = useRef(null)
  
  const [formData, setFormData] = useState({
    employee_code: '',
    full_name: '',
    email: '',
    password: '',
    role: 'Employee',
    department_id: '',
    designation_id: '',
    basic_salary: ''
  })

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    fetchEmployees()
    fetchDepartments()
    fetchDesignations()
  }, [])

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*, departments(name), designations(title)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEmployees(data || [])
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('*')
    setDepartments(data || [])
  }

  const fetchDesignations = async () => {
    const { data } = await supabase.from('designations').select('*')
    setDesignations(data || [])
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleAddEmployee = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      // 1. Create Login Account in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError
      const userId = authData.user?.id

      // 2. Insert Employee Details linked with user_id
      const { error: empError } = await supabase.from('employees').insert([
        {
          user_id: userId,
          employee_code: formData.employee_code,
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          department_id: formData.department_id || null,
          designation_id: formData.designation_id || null,
          basic_salary: parseFloat(formData.basic_salary) || 0
        }
      ])

      if (empError) throw empError

      setSuccessMsg('Employee & Login account created successfully! 🎉')
      setFormData({
        employee_code: '',
        full_name: '',
        email: '',
        password: '',
        role: 'Employee',
        department_id: '',
        designation_id: '',
        basic_salary: ''
      })
      fetchEmployees()
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 1. Export Employees Data to CSV
  const exportToCSV = () => {
    if (employees.length === 0) {
      alert('No employee data available to export.')
      return
    }

    const headers = ['Employee Code', 'Full Name', 'Email', 'Role', 'Status', 'Basic Salary', 'Department', 'Designation']
    
    const rows = employees.map(emp => [
      `"${emp.employee_code || ''}"`,
      `"${emp.full_name || ''}"`,
      `"${emp.email || ''}"`,
      `"${emp.role || ''}"`,
      `"${emp.status || 'Active'}"`,
      `"${emp.basic_salary || 0}"`,
      `"${emp.departments?.name || ''}"`,
      `"${emp.designations?.title || ''}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Employee_Directory_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 2. Import Employees Data from CSV
  const handleCSVImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result
        const lines = text.split('\n').filter(line => line.trim() !== '')
        if (lines.length <= 1) {
          alert('CSV file is empty or missing data rows.')
          return
        }

        const newEmployees = []
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(val => val.replace(/^"|"$/g, '').trim())
          if (values.length >= 3 && values[1]) {
            newEmployees.push({
              employee_code: values[0] || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
              full_name: values[1],
              email: values[2],
              role: values[3] || 'Employee',
              status: values[4] || 'Active',
              basic_salary: Number(values[5]) || 30000
            })
          }
        }

        if (newEmployees.length === 0) {
          alert('No valid employee records found in CSV.')
          return
        }

        const { error } = await supabase.from('employees').insert(newEmployees)
        if (error) throw error

        setSuccessMsg(`Successfully imported ${newEmployees.length} employees from CSV! 🎉`)
        fetchEmployees()
      } catch (err) {
        setErrorMsg(`Import Error: ${err.message}`)
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="container mt-5 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">👥 Employee Directory & Management</h2>
          <p className="text-secondary mb-0">Register staff, manage credentials, and export/import via CSV.</p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={exportToCSV} className="btn btn-outline-success btn-sm fw-semibold">
            📥 Export CSV
          </button>
          <button onClick={() => fileInputRef.current.click()} className="btn btn-primary btn-sm fw-semibold">
            📤 Import CSV
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleCSVImport} 
            accept=".csv" 
            style={{ display: 'none' }} 
          />
        </div>
      </div>

      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="row">
        {/* Add Employee Form */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm border-0 p-4">
            <h5 className="fw-semibold mb-3">Add New Employee & Login</h5>
            <form onSubmit={handleAddEmployee}>
              <div className="mb-2">
                <label className="form-label text-secondary small">Employee Code</label>
                <input type="text" className="form-control form-control-sm" name="employee_code" placeholder="e.g. EMP-004" value={formData.employee_code} onChange={handleInputChange} required />
              </div>

              <div className="mb-2">
                <label className="form-label text-secondary small">Full Name</label>
                <input type="text" className="form-control form-control-sm" name="full_name" placeholder="e.g. Ahmed Raza" value={formData.full_name} onChange={handleInputChange} required />
              </div>

              <div className="mb-2">
                <label className="form-label text-secondary small">Email (Login ID)</label>
                <input type="email" className="form-control form-control-sm" name="email" placeholder="ahmed@company.com" value={formData.email} onChange={handleInputChange} required />
              </div>

              <div className="mb-2">
                <label className="form-label text-secondary small">Password</label>
                <input type="password" className="form-control form-control-sm" name="password" placeholder="Min 6 characters" value={formData.password} onChange={handleInputChange} required />
              </div>

              <div className="mb-2">
                <label className="form-label text-secondary small">Role</label>
                <select className="form-select form-select-sm" name="role" value={formData.role} onChange={handleInputChange}>
                  <option value="Employee">Employee</option>
                  <option value="HR">HR</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="mb-2">
                <label className="form-label text-secondary small">Department</label>
                <select className="form-select form-select-sm" name="department_id" value={formData.department_id} onChange={handleInputChange}>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div className="mb-2">
                <label className="form-label text-secondary small">Designation</label>
                <select className="form-select form-select-sm" name="designation_id" value={formData.designation_id} onChange={handleInputChange}>
                  <option value="">Select Designation</option>
                  {designations.map(ds => <option key={ds.id} value={ds.id}>{ds.title}</option>)}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small">Basic Salary</label>
                <input type="number" className="form-control form-control-sm" name="basic_salary" placeholder="50000" value={formData.basic_salary} onChange={handleInputChange} required />
              </div>

              <button type="submit" className="btn btn-primary w-100 fw-semibold" disabled={loading}>
                {loading ? 'Creating Account...' : 'Save Employee & Login'}
              </button>
            </form>
          </div>
        </div>

        {/* Employees Table List */}
        <div className="col-md-8">
          <div className="card shadow-sm border-0 p-4">
            <h5 className="fw-semibold mb-3">All Employees Directory</h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle small">
                <thead className="table-light">
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Dept</th>
                    <th>Designation</th>
                    <th>Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length > 0 ? (
                    employees.map((emp) => (
                      <tr key={emp.id}>
                        <td className="fw-bold">{emp.employee_code}</td>
                        <td>{emp.full_name}<br/><span className="text-muted" style={{fontSize: '11px'}}>{emp.email}</span></td>
                        <td><span className={`badge ${emp.role === 'Admin' ? 'bg-danger' : emp.role === 'HR' ? 'bg-warning text-dark' : 'bg-primary'}`}>{emp.role}</span></td>
                        <td>{emp.departments?.name || 'N/A'}</td>
                        <td>{emp.designations?.title || 'N/A'}</td>
                        <td>Rs. {emp.basic_salary?.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-4">No employees registered yet.</td>
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