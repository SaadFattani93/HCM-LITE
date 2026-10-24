import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
useEffect(() => {
  // Right-click disable karne ke liye
  const handleContext = (e) => e.preventDefault()
  document.addEventListener('contextmenu', handleContext)

  // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U disable karne ke liye
  const handleKeyDown = (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
      (e.ctrlKey && e.key === 'U')
    ) {
      e.preventDefault()
    }
  }
  document.addEventListener('keydown', handleKeyDown)

  return () => {
    document.removeEventListener('contextmenu', handleContext)
    document.removeEventListener('keydown', handleKeyDown)
  }
}, [])