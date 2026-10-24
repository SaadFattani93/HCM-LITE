import { useEffect, useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import { supabase } from './supabaseClient'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import HrDashboard from './pages/HrDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Departments from './pages/Departments'
import Designations from './pages/Designations'
import Attendance from './pages/Attendance'
import Employees from './pages/Employees'
import HRAttendanceBoard from './pages/HRAttendanceBoard'
import HRLeaves from './pages/HRLeaves'
import Payroll from './pages/Payroll'
import CompanySettings from './pages/CompanySettings'
import HRAttendanceCorrections from './pages/HRAttendanceCorrections'
import Announcements from './pages/Announcements'
import AuditLogs from './pages/AuditLogs'


import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/hr" element={<HrDashboard />} />
        <Route path="/employee" element={<EmployeeDashboard />} />
        <Route path="/hr/attendance-corrections" element={<HRAttendanceCorrections />} />
        <Route path="/admin/departments" element={<Departments />} />
        <Route path="/admin/designations" element={<Designations />} />
        <Route path="/admin/attendance" element={<Attendance />} />
        <Route path="/hr/payroll" element={<Payroll />} />
        <Route path="/hr/leaves" element={<HRLeaves />} />
        <Route path="/admin/employees" element={<Employees />} />
        <Route path="/hr/attendance" element={<HRAttendanceBoard />} />
        <Route path="/admin/audit-logs" element={<AuditLogs />} /> 
        <Route path="/admin/settings" element={<CompanySettings />} />
<Route path="/announcements" element={<Announcements />} />
        {/* Unknown routes redirect to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App