import { supabase } from '../server.js';

/**
 * Audit logger — logs user actions for compliance and debugging.
 *
 * Supports two call signatures:
 *   auditLog(action, details)
 *   auditLog(userId, action, resource, resourceId, metadata)
 */
export const auditLog = async (...args) => {
  try {
    let userId, action, resource, resourceId, metadata;

    if (args.length <= 2) {
      // Simple: auditLog('ACTION', { ... })
      action = args[0];
      metadata = args[1] || {};
    } else {
      // Full: auditLog(userId, 'ACTION', 'resource', resourceId, { ... })
      [userId, action, resource, resourceId, metadata] = args;
    }

    const logEntry = {
      userId,
      action,
      resource,
      resourceId,
      ...(metadata || {}),
      timestamp: new Date().toISOString(),
    };

    console.log(`[AUDIT] ${action}:`, JSON.stringify(logEntry));

    // Persist to audit_logs table if it exists
    if (supabase) {
      try {
        await supabase.from('audit_logs').insert({
          user_id: userId || null,
          action,
          resource_type: resource || null,
          resource_id: resourceId?.toString() || null,
          metadata: metadata || {},
        });
      } catch {
        // Table might not exist yet — that's fine, console log is the primary record
      }
    }
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

export default auditLog;
