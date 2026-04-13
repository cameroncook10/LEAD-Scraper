/**
 * Sentry wrapper — only activates when VITE_SENTRY_DSN is set.
 * All calls are safe no-ops when Sentry is not configured.
 */

let Sentry = null;

export async function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  try {
    const mod = await import('@sentry/react');
    Sentry = mod;

    Sentry.init({
      dsn,
      environment:  import.meta.env.MODE,
      release:      import.meta.env.VITE_APP_VERSION || 'unknown',
      tracesSampleRate: import.meta.env.MODE === 'production' ? 0.2 : 1.0,
      replaysSessionSampleRate:    0.05,
      replaysOnErrorSampleRate:    1.0,
      integrations: (integrations) => [
        ...integrations,
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
    });
  } catch (e) {
    console.warn('Sentry failed to load:', e);
  }
}

export function captureException(error, context) {
  if (Sentry) {
    Sentry.captureException(error, context);
  } else {
    console.error('[Error]', error, context);
  }
}

export function setUser(user) {
  if (Sentry && user) {
    Sentry.setUser({ id: user.id, email: user.email });
  }
}

export function clearUser() {
  if (Sentry) Sentry.setUser(null);
}
