import { supabase } from '../server.js';

export const auditLog = async (action, details = {}) => {
  try {
    console.log(`[AUDIT] ${action}:`, JSON.stringify(details));
    // Future: persist to supabase audit_logs table
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

export default auditLog;
