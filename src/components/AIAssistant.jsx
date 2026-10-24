import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function AIAssistant({ role = 'Employee', empId = null }) {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: `Hello! I am your Enterprise HCM AI Assistant (${role} Level). Ask me about payroll, employees, attendance, or company policies!` }
  ])
  const [input, setInput] = useState('')
  const [contextData, setContextData] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchRealContextData()
  }, [role, empId])

  const fetchRealContextData = async () => {
    try {
      let dataContext = {}

      const { data: settings } = await supabase.from('company_settings').select('*').maybeSingle()
      dataContext.companySettings = settings || {}

      if (role === 'Admin' || role === 'HR') {
        const { data: emp } = await supabase.from('employees').select('id, full_name, basic_salary, status, role')
        const { data: leaves } = await supabase.from('leave_requests').select('*')
        dataContext.totalEmployees = emp?.length || 0
        dataContext.activeEmployees = emp?.filter(e => e.status !== 'Inactive')?.length || 0
        dataContext.totalPayroll = emp?.reduce((acc, e) => acc + (e.basic_salary || 0), 0) || 0
        dataContext.pendingLeaves = leaves?.filter(l => l.status === 'Pending') || []
        dataContext.allEmployees = emp || []
      } else {
        if (empId) {
          const { data: myEmp } = await supabase.from('employees').select('*, departments(name), designations(title)').eq('id', empId).maybeSingle()
          const { data: myLeaves } = await supabase.from('leave_requests').select('*').eq('employee_id', empId)
          const { data: myPayrolls } = await supabase.from('payroll').select('*').eq('employee_id', empId)
          dataContext.profile = myEmp
          dataContext.myLeaves = myLeaves || []
          dataContext.myPayrolls = myPayrolls || []
        }
      }

      setContextData(dataContext)
    } catch (err) {
      console.error("AI Context Error:", err)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg = input
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }])
    setInput('')
    setLoading(true)

    setTimeout(() => {
      let reply = ""
      const lower = userMsg.toLowerCase()

      // Greetings
      if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        reply = `Hello! 👋 How can I help you manage your HCM operations today? You can ask me about total employees, payroll costs, office timings, or your leave status.`
      }
      // Policy Q&A (#22)
      else if (lower.includes('timing') || lower.includes('hour') || lower.includes('office') || lower.includes('grace')) {
        reply = `🕒 Office Timing Policy: Office hours are ${contextData.companySettings?.start_time || '09:00 AM'} to ${contextData.companySettings?.end_time || '06:00 PM'} with a grace period of ${contextData.companySettings?.grace_period_mins || 15} minutes.`
      } 
      else if (lower.includes('weekend') || lower.includes('holiday')) {
        reply = `🌴 Weekend Policy: Configured weekends are ${contextData.companySettings?.weekend_days || 'Saturday, Sunday'}.`
      }
      // Admin / HR Real Data Queries (#19)
      else if ((role === 'Admin' || role === 'HR') && (lower.includes('payroll') || lower.includes('salary') || lower.includes('cost'))) {
        reply = `💰 Total Monthly Payroll Expenditure: Rs. ${contextData.totalPayroll?.toLocaleString()} across ${contextData.totalEmployees} total registered staff.`
      } 
      else if ((role === 'Admin' || role === 'HR') && (lower.includes('employee') || lower.includes('staff') || lower.includes('headcount'))) {
        reply = `👥 Workforce Overview: There are currently ${contextData.activeEmployees} active employees onboarded in the system out of ${contextData.totalEmployees} total records.`
      }
      else if ((role === 'Admin' || role === 'HR') && (lower.includes('leave') || lower.includes('pending'))) {
        reply = `📋 Leave Status: There are ${contextData.pendingLeaves?.length || 0} pending leave requests waiting for HR review.`
      }
      // Employee Specific Queries (#19)
      else if (role === 'Employee' && (lower.includes('salary') || lower.includes('payslip') || lower.includes('pay'))) {
        reply = `💰 Salary Info: Your basic salary is Rs. ${contextData.profile?.basic_salary?.toLocaleString() || 0}. You have ${contextData.myPayrolls?.length || 0} finalized payslip(s) in your portal.`
      }
      else if (role === 'Employee' && (lower.includes('leave') || lower.includes('application'))) {
        reply = `🌴 Leave History: You have submitted ${contextData.myLeaves?.length || 0} leave applications so far.`
      }
      else if (role === 'Employee' && (lower.includes('profile') || lower.includes('my info'))) {
        reply = `👤 Profile Summary: ${contextData.profile?.full_name} (${contextData.profile?.employee_code}), Dept: ${contextData.profile?.departments?.name || 'N/A'}, Role: ${contextData.profile?.role}.`
      }
      // Smart Fallback
      else {
        reply = `🤖 I analyzed your query ("${userMsg}") against database context. Try asking: "Show payroll", "What are office timings?", "Pending leaves", or "My salary".`
      }

      setMessages(prev => [...prev, { sender: 'ai', text: reply }])
      setLoading(false)
    }, 500)
  }

  return (
    <div className="card shadow-sm border-0 p-3" style={{ borderRadius: '12px' }}>
      <div className="d-flex align-items-center mb-3">
        <span className="fs-5 me-2">🤖</span>
        <h6 className="fw-bold mb-0">HCM AI Assistant ({role} Access)</h6>
      </div>

      <div className="bg-light p-3 rounded mb-3" style={{ height: '240px', overflowY: 'auto' }}>
        {messages.map((m, idx) => (
          <div key={idx} className={`d-flex mb-2 ${m.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
            <div className={`p-2 rounded small ${m.sender === 'user' ? 'bg-primary text-white' : 'bg-white border text-dark'}`} style={{ maxWidth: '85%' }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-muted small text-center">AI is analyzing database...</div>}
      </div>

      <form onSubmit={handleSend} className="d-flex gap-2">
        <input 
          type="text" 
          className="form-control form-control-sm" 
          placeholder="Ask e.g. 'What is the payroll cost?', 'Office timings'..." 
          value={input} 
          onChange={e => setInput(e.target.value)} 
        />
        <button type="submit" className="btn btn-primary btn-sm fw-semibold" disabled={loading}>Send</button>
      </form>
    </div>
  )
}