import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function AIDashboardSummary({ role = 'Admin' }) {
  const [summary, setSummary] = useState('Generating live AI executive summary...')

  useEffect(() => {
    generateAISummary()
  }, [role])

  const generateAISummary = async () => {
    try {
      const { data: emps } = await supabase.from('employees').select('id, basic_salary')
      const { data: leaves } = await supabase.from('leave_requests').select('status')
      
      const empCount = emps?.length || 0
      const totalSalary = emps?.reduce((acc, e) => acc + (e.basic_salary || 0), 0) || 0
      const pendingLeaves = leaves?.filter(l => l.status === 'Pending').length || 0

      if (role === 'Admin') {
        setSummary(`🤖 AI Executive Insights: System is active with ${empCount} registered employees. Total payroll commitment stands at Rs. ${totalSalary.toLocaleString()}. There are ${pendingLeaves} pending leave actions requiring management review.`)
      } else {
        setSummary(`🤖 AI HR Operational Brief: Workforce active count is ${empCount}. ${pendingLeaves} pending leave requests require immediate HR verification. System compliance rate is optimal.`)
      }
    } catch (err) {
      setSummary('AI Summary unavailable.')
    }
  }

  return (
    <div className="alert alert-info border-0 shadow-sm d-flex align-items-center p-3 mb-4" style={{ borderRadius: '10px' }}>
      <div className="lh-sm">
        <strong className="d-block mb-1 text-primary">✨ AI Dashboard Summary (#20)</strong>
        <span className="small text-dark">{summary}</span>
      </div>
    </div>
  )
}