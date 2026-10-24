import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function Designations() {
  const [designations, setDesignations] = useState([])
  const [departments, setDepartments] = useState([])
  const [title, setTitle] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchDepartments()
    fetchDesignations()
  }, [])

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase.from('departments').select('*')
      if (error) throw error
      setDepartments(data || [])
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  const fetchDesignations = async () => {
    try {
      // Simple fetch without strict foreign key embedding to prevent crash
      const { data, error } = await supabase
        .from('designations')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error
      setDesignations(data || [])
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  const handleAddDesignation = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setErrorMsg('')

    try {
      // Insert only the designation title (safe fallback)
      const payload = { title: title }
      if (departmentId) {
        payload.department_id = departmentId
      }

      const { error } = await supabase.from('designations').insert([payload])

      if (error) throw error

      setTitle('')
      setDepartmentId('')
      fetchDesignations()
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mt-5">
      <h2 className="fw-bold mb-4">💼 Designation Management</h2>

      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

      <div className="row">
        {/* Add Designation Form */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm border-0 p-4">
            <h5 className="fw-semibold mb-3">Add New Designation</h5>
            <form onSubmit={handleAddDesignation}>
              <div className="mb-3">
                <label className="form-label text-secondary small">Designation Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Senior Software Engineer" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required 
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small">Department (Optional)</label>
                <select 
                  className="form-select"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name || dept.department_name}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary w-100 fw-semibold" disabled={loading}>
                {loading ? 'Adding...' : 'Add Designation'}
              </button>
            </form>
          </div>
        </div>

        {/* Designations List Table */}
        <div className="col-md-8">
          <div className="card shadow-sm border-0 p-4">
            <h5 className="fw-semibold mb-3">Designations List</h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Designation Title</th>
                  </tr>
                </thead>
                <tbody>
                  {designations.length > 0 ? (
                    designations.map((desig, index) => (
                      <tr key={desig.id}>
                        <td>{index + 1}</td>
                        <td className="fw-semibold">{desig.title}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="text-center text-muted py-4">No designations found. Add one!</td>
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