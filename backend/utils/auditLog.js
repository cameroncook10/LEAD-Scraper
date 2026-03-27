import { supabase } from '../server.js';

export const auditLog = async (userId, action, resourceType = null, resourceId = null, details = {}) => {
  try {
    console.log(`[AUDIT] user=${userId} action=${action} resource=${resourceType}/${resourceId}`, JSON.stringify(details));

    // Persist to audit_logs table if it exists
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        created_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) {
          // Table may not exist yet — log only, don't crash
          console.debug('[AUDIT] DB write skipped:', error.message);
        }
      });
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

export default auditLog;
