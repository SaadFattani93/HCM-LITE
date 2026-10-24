import { useState } from 'react'

export default function SmartLeaveInput({ onParseComplete }) {
  const [prompt, setPrompt] = useState('')

  const handleSmartParse = (e) => {
    e.preventDefault()
    if (!prompt.trim()) return

    const lower = prompt.toLowerCase()
    let type = 'Annual'
    if (lower.includes('sick') || lower.includes('fever') || lower.includes('doctor') || lower.includes('ill')) type = 'Sick'
    if (lower.includes('casual') || lower.includes('personal') || lower.includes('urgent')) type = 'Casual'

    // Extract dates or default to tomorrow
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const end = new Date(tomorrow)
    if (lower.includes('3 days') || lower.includes('three days')) end.setDate(end.getDate() + 2)
    else if (lower.includes('2 days') || lower.includes('two days')) end.setDate(end.getDate() + 1)

    const parsedData = {
      leave_type: type,
      start_date: tomorrow.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
      reason: prompt
    }

    onParseComplete(parsedData)
    setPrompt('')
  }

  return (
    <div className="bg-light p-3 rounded mb-3 border">
      <label className="form-label small fw-bold text-primary">✨ Smart Leave Prompt (#21)</label>
      <div className="input-group input-group-sm">
        <input 
          type="text" 
          className="form-control" 
          placeholder="e.g. Need 3 days sick leave from tomorrow due to fever..." 
          value={prompt} 
          onChange={e => setPrompt(e.target.value)} 
        />
        <button onClick={handleSmartParse} className="btn btn-primary fw-semibold" type="button">
          Auto-Fill Form
        </button>
      </div>
    </div>
  )
}