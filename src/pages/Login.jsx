import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

 const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      // 1. Supabase Auth Login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) throw authError

      const userId = authData.user.id

      // 2. Fetch role from 'employees' table
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('role')
        .eq('user_id', userId)
        .single()

      if (empError || !empData) {
        throw new Error('Employee profile not found for this user.')
      }

      const role = empData.role
      alert(`Login Successful as ${role}!`)

      // Yahan hum role ke hisab se state ya router change karenge (Agle step mein router set karenge)
      if (role === 'Admin') window.location.href = '/admin'
      else if (role === 'HR') window.location.href = '/hr'
      else window.location.href = '/employee'

    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-fluid vh-100 d-flex justify-content-center align-items-center" style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #6f42c1 100%)' }}>
      <div className="card shadow-lg border-0 p-5 rounded-4" style={{ width: '450px', backgroundColor: '#ffffff' }}>
        
        <div className="text-center mb-4">
          <div className="bg-primary text-white rounded-circle d-inline-flex justify-content-center align-items-center mb-3 shadow" style={{ width: '65px', height: '65px', fontSize: '28px' }}>
            🏢
          </div>
          <h2 className="fw-bold text-dark">HCM Lite</h2>
          <p className="text-muted small">Human Capital Management System</p>
        </div>
        
        {errorMsg && <div className="alert alert-danger py-2 small">{errorMsg}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label fw-semibold text-secondary small">Email Address</label>
            <input 
              type="email" 
              className="form-control form-control-lg fs-6" 
              placeholder="name@company.com"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold text-secondary small">Password</label>
            <input 
              type="password" 
              className="form-control form-control-lg fs-6" 
              placeholder="Enter your password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-100 py-2 fw-semibold shadow-sm" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-4 text-muted small">
          <span>Saylani Hackathon Project</span>
        </div>
      </div>
    </div>
  )
}