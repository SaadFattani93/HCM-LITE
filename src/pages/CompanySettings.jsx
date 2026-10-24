import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function CompanySettings() {
  const [settings, setSettings] = useState({
    company_name: '',
    office_start_time: '09:00',
    office_end_time: '17:00',
    grace_time_minutes: 15,
    weekend_days: 'Saturday, Sunday',
    office_address: '',
    office_radius_meters: 100
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (data) setSettings(data)
    } catch (err) {
      setMsg({ type: 'danger', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg({ type: '', text: '' })

    try {
      const { data: existing } = await supabase.from('company_settings').select('id').limit(1)

      if (existing && existing.length > 0) {
        const { error } = await supabase
          .from('company_settings')
          .update({ ...settings, updated_at: new Date().toISOString() })
          .eq('id', existing[0].id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('company_settings').insert([settings])
        if (error) throw error
      }

      setMsg({ type: 'success', text: 'Company settings updated successfully!' })
      fetchSettings()
    } catch (err) {
      setMsg({ type: 'danger', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="container mt-5 text-center">Loading settings...</div>

  return (
    <div className="container mt-5 mb-5">
      <h2 className="fw-bold mb-3">⚙️ Company Setup & Rules</h2>
      <p className="text-secondary mb-4">Configure office timings, grace period, location parameters, and work rules.</p>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="card shadow-sm border-0 p-4">
        <form onSubmit={handleSave}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold small">Company Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={settings.company_name} 
                onChange={e => setSettings({...settings, company_name: e.target.value})} 
                required 
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold small">Weekend Days</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Saturday, Sunday"
                value={settings.weekend_days} 
                onChange={e => setSettings({...settings, weekend_days: e.target.value})} 
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold small">Office Start Time</label>
              <input 
                type="time" 
                className="form-control" 
                value={settings.office_start_time} 
                onChange={e => setSettings({...settings, office_start_time: e.target.value})} 
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold small">Office End Time</label>
              <input 
                type="time" 
                className="form-control" 
                value={settings.office_end_time} 
                onChange={e => setSettings({...settings, office_end_time: e.target.value})} 
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold small">Grace Time (Minutes)</label>
              <input 
                type="number" 
                className="form-control" 
                value={settings.grace_time_minutes} 
                onChange={e => setSettings({...settings, grace_time_minutes: e.target.value})} 
              />
            </div>

            <div className="col-md-8">
              <label className="form-label fw-semibold small">Office Address</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Full Office Address"
                value={settings.office_address || ''} 
                onChange={e => setSettings({...settings, office_address: e.target.value})} 
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold small">Allowed Radius (Meters)</label>
              <input 
                type="number" 
                className="form-control" 
                value={settings.office_radius_meters} 
                onChange={e => setSettings({...settings, office_radius_meters: e.target.value})} 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary mt-4 fw-semibold" disabled={saving}>
            {saving ? 'Saving...' : 'Save Company Settings'}
          </button>
        </form>
      </div>
    </div>
  )
}