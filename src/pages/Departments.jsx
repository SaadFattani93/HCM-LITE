import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function Departments() {
  const [departments, setDepartments] = useState([])
  const [deptName, setDeptName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      // Trying 'name' column first
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('id', { ascending: true })
        
      if (error) throw error
      setDepartments(data || [])
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  const handleAddDepartment = async (e) => {
    e.preventDefault()
    if (!deptName.trim()) return

    setLoading(true)
    setErrorMsg('')

    try {
      // Inserting into 'name' column
      const { error } = await supabase
        .from('departments')
        .insert([{ name: deptName }])

      if (error) throw error

      setDeptName('')
      fetchDepartments()
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mt-5">
      <h2 className="fw-bold mb-4">🏢 Department Management</h2>

      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm border-0 p-4">
            <h5 className="fw-semibold mb-3">Add New Department</h5>
            <form onSubmit={handleAddDepartment}>
              <div className="mb-3">
                <label className="form-label text-secondary small">Department Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Human Resources" 
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary w-100 fw-semibold" disabled={loading}>
                {loading ? 'Adding...' : 'Add Department'}
              </button>
            </form>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card shadow-sm border-0 p-4">
            <h5 className="fw-semibold mb-3">Departments List</h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Department Name</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.length > 0 ? (
                    departments.map((dept, index) => (
                      <tr key={dept.id}>
                        <td>{index + 1}</td>
                        <td className="fw-semibold">{dept.name || dept.department_name}</td>
                        <td className="text-muted small">
                          {dept.created_at ? new Date(dept.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center text-muted py-4">No departments found. Add one!</td>
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