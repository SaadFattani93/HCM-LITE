import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (err) {
      console.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePost = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase
        .from('announcements')
        .insert([{ title, content }])

      if (error) throw error
      setTitle('')
      setContent('')
      fetchAnnouncements()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mt-5 mb-5">
      <h2 className="fw-bold mb-3">📢 Company Announcements</h2>
      <p className="text-secondary mb-4">Broadcast important updates and news across the organization.</p>

      {/* Post Announcement Form */}
      <div className="card shadow-sm border-0 p-4 mb-4">
        <h5 className="fw-semibold mb-3">Post New Announcement</h5>
        <form onSubmit={handlePost}>
          <div className="mb-3">
            <input 
              type="text" 
              className="form-control" 
              placeholder="Announcement Title..." 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required 
            />
          </div>
          <div className="mb-3">
            <textarea 
              className="form-control" 
              rows="3" 
              placeholder="Write announcement content..." 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              required 
            ></textarea>
          </div>
          <button type="submit" className="btn btn-primary btn-sm fw-semibold" disabled={saving}>
            {saving ? 'Posting...' : 'Post Announcement'}
          </button>
        </form>
      </div>

      {/* List Announcements */}
      <h5 className="fw-semibold mb-3">Recent Announcements</h5>
      {loading ? (
        <p>Loading announcements...</p>
      ) : announcements.length > 0 ? (
        announcements.map(item => (
          <div key={item.id} className="card shadow-sm border-0 p-4 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="fw-bold mb-0 text-dark">{item.title}</h5>
              <span className="text-muted small">{new Date(item.created_at).toLocaleString()}</span>
            </div>
            <p className="text-secondary mb-0">{item.content}</p>
          </div>
        ))
      ) : (
        <div className="alert alert-light text-center">No announcements posted yet.</div>
      )}
    </div>
  )
}