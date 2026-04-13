/**
 * Sentry wrapper for the Node.js backend.
 * Only activates when SENTRY_DSN is set in the environment.
 * All helpers are safe no-ops when Sentry is not configured.
 */

let Sentry = null;

export async function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    const mod = await import('@sentry/node');
    Sentry = mod;

    Sentry.init({
      dsn,
      environment:      process.env.NODE_ENV || 'production',
      release:          process.env.npm_package_version || 'unknown',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [
        Sentry.httpIntegration(),
        Sentry.expressIntegration(),
      ],
    });
  } catch (e) {
    console.warn('Sentry failed to initialise:', e.message);
  }
}

/** Express error-handler middleware that forwards errors to Sentry */
export function sentryErrorHandler() {
  if (Sentry) return Sentry.expressErrorHandler();
  // No-op middleware
  return (_err, _req, _res, next) => next(_err);
}

/** Express request-handler middleware (for tracing) */
export function sentryRequestHandler() {
  if (Sentry) return Sentry.expressRequestHandler();
  return (_req, _res, next) => next();
}

export function captureException(error, context) {
  if (Sentry) {
    Sentry.captureException(error, context);
  }
}
