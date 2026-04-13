/**
 * Sentry wrapper — only activates when VITE_SENTRY_DSN is set AND
 * @sentry/react is installed.
 *
 * To enable full Sentry support:
 *   cd frontend && npm install @sentry/react
 *   Set VITE_SENTRY_DSN in your environment.
 *
 * All exports are safe no-ops until then.
 */

let Sentry = null;

export async function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  try {
    // vite-ignore: @sentry/react is an optional peer dependency.
    // Install it to activate error tracking; the app works without it.
    const mod = await import(/* @vite-ignore */ '@sentry/react');
    Sentry = mod;

    Sentry.init({
      dsn,
      environment:             import.meta.env.MODE,
      release:                 import.meta.env.VITE_APP_VERSION || 'unknown',
      tracesSampleRate:        import.meta.env.MODE === 'production' ? 0.2 : 1.0,
      replaysSessionSampleRate: 0.05,
      replaysOnErrorSampleRate: 1.0,
      integrations: (integrations) => [
        ...integrations,
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
    });
  } catch {
    // Package not installed or failed to load — silently degrade
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
