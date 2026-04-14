/**
 * Subscription Check Middleware
 *
 * Verifies the authenticated user has an active (or trialing) subscription
 * and has not exceeded plan usage limits.
 *
 * Usage in routes:
 *   import { requireSubscription, requirePlan } from '../middleware/subscriptionCheck.js';
 *
 *   router.get('/leads', requireAuth, requireSubscription, handler);
 *   router.post('/scrape', requireAuth, requirePlan('starter'), handler);
 */

import { supabase } from '../server.js';

// ---------------------------------------------------------------------------
// Admin bypass — comma-separated emails in ADMIN_EMAILS env var get full access
// ---------------------------------------------------------------------------
const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
);

function isAdmin(req) {
  return req.user?.email && ADMIN_EMAILS.has(req.user.email.toLowerCase());
}

// ---------------------------------------------------------------------------
// Plan limits (per billing period / month)
// ---------------------------------------------------------------------------
const PLAN_LIMITS = {
  starter: {
    leads_scraped: 5000,
    dms_sent: 500,
    emails_sent: Infinity, // not capped for starter in spec
  },
  growth: {
    leads_scraped: Infinity,
    dms_sent: Infinity,
    emails_sent: Infinity,
  },
  enterprise: {
    leads_scraped: Infinity,
    dms_sent: Infinity,
    emails_sent: Infinity,
  },
};

const ALLOWED_STATUSES = ['active', 'trialing'];

// Plan hierarchy for requirePlan — higher index = more powerful
const PLAN_HIERARCHY = ['starter', 'growth', 'enterprise'];

// ---------------------------------------------------------------------------
// Core: fetch the user's active subscription
// ---------------------------------------------------------------------------
async function getActiveSubscription(userId) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ALLOWED_STATUSES)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}

// ---------------------------------------------------------------------------
// Core: fetch current-period usage
// ---------------------------------------------------------------------------
async function getCurrentUsage(userId, periodStart, periodEnd) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('usage_tracking')
    .select('leads_scraped, dms_sent, emails_sent')
    .eq('user_id', userId)
    .gte('period_start', periodStart)
    .lte('period_end', periodEnd)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    // No usage row yet — usage is zero
    return { leads_scraped: 0, dms_sent: 0, emails_sent: 0 };
  }
  return data;
}

// ---------------------------------------------------------------------------
// Middleware: requireSubscription
// Rejects with 403 if the user has no active/trialing subscription.
// ---------------------------------------------------------------------------
export const requireSubscription = async (req, res, next) => {
  // Skip when Supabase is not configured (local/Electron dev mode)
  if (!supabase) return next();
  // Admin bypass
  if (isAdmin(req)) return next();

  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be logged in to access this resource.',
    });
  }

  const subscription = await getActiveSubscription(userId);
  if (!subscription) {
    return res.status(403).json({
      error: 'Subscription required',
      message: 'You need an active subscription to access this feature. Please subscribe at our pricing page.',
      code: 'NO_ACTIVE_SUBSCRIPTION',
    });
  }

  // Attach subscription to request for downstream use
  req.subscription = subscription;
  next();
};

// ---------------------------------------------------------------------------
// Middleware factory: requirePlan(minimumPlan)
// Ensures the user's plan is at or above the specified minimum.
// Also checks subscription is active and usage limits are not exceeded.
// ---------------------------------------------------------------------------
export function requirePlan(minimumPlan) {
  const minIndex = PLAN_HIERARCHY.indexOf(minimumPlan);

  return async (req, res, next) => {
    // Skip when Supabase is not configured (local/Electron dev mode)
    if (!supabase) return next();
    // Admin bypass
    if (isAdmin(req)) return next();

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource.',
      });
    }

    const subscription = await getActiveSubscription(userId);
    if (!subscription) {
      return res.status(403).json({
        error: 'Subscription required',
        message: 'You need an active subscription to access this feature.',
        code: 'NO_ACTIVE_SUBSCRIPTION',
      });
    }

    // Check plan hierarchy
    const userPlanIndex = PLAN_HIERARCHY.indexOf(subscription.plan);
    if (userPlanIndex < minIndex) {
      return res.status(403).json({
        error: 'Plan upgrade required',
        message: `This feature requires the ${minimumPlan} plan or higher. You are on the ${subscription.plan} plan.`,
        code: 'PLAN_UPGRADE_REQUIRED',
        currentPlan: subscription.plan,
        requiredPlan: minimumPlan,
      });
    }

    // Check usage limits
    const limits = PLAN_LIMITS[subscription.plan] || PLAN_LIMITS.starter;
    const usage = await getCurrentUsage(
      userId,
      subscription.current_period_start,
      subscription.current_period_end
    );

    if (
      usage.leads_scraped >= limits.leads_scraped ||
      usage.dms_sent >= limits.dms_sent ||
      usage.emails_sent >= limits.emails_sent
    ) {
      const exceeded = [];
      if (usage.leads_scraped >= limits.leads_scraped) exceeded.push('leads');
      if (usage.dms_sent >= limits.dms_sent) exceeded.push('DMs');
      if (usage.emails_sent >= limits.emails_sent) exceeded.push('emails');

      return res.status(429).json({
        error: 'Usage limit exceeded',
        message: `You have reached your ${subscription.plan} plan limit for: ${exceeded.join(', ')}. Upgrade your plan for higher limits.`,
        code: 'USAGE_LIMIT_EXCEEDED',
        usage: {
          leads_scraped: usage.leads_scraped,
          dms_sent: usage.dms_sent,
          emails_sent: usage.emails_sent,
        },
        limits: {
          leads_scraped: limits.leads_scraped === Infinity ? 'unlimited' : limits.leads_scraped,
          dms_sent: limits.dms_sent === Infinity ? 'unlimited' : limits.dms_sent,
          emails_sent: limits.emails_sent === Infinity ? 'unlimited' : limits.emails_sent,
        },
        plan: subscription.plan,
      });
    }

    // Attach for downstream
    req.subscription = subscription;
    req.usage = usage;
    next();
  };
}

export default requireSubscription;
