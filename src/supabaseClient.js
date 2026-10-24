import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)


// Helper Function to log system actions
export const logAuditAction = async (userEmail, action, module, details) => {
  try {
    await supabase.from('audit_logs').insert([
      {
        user_email: userEmail || 'System Admin',
        action: action,
        module: module,
        details: details
      }
    ])
  } catch (err) {
    console.error('Audit Log Error:', err.message)
  }
}