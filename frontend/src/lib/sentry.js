/**
 * Sentry stub — no dynamic imports, guaranteed build-safe.
 *
 * To enable full Sentry error tracking:
 *   1. cd frontend && npm install @sentry/react
 *   2. Set VITE_SENTRY_DSN in your environment / Vercel project settings
 *   3. Replace this file with the real initialisation below:
 *
 *   import * as Sentry from '@sentry/react';
 *   export function initSentry() {
 *     const dsn = import.meta.env.VITE_SENTRY_DSN;
 *     if (!dsn) return;
 *     Sentry.init({ dsn, tracesSampleRate: 0.2, ... });
 *   }
 *   export const captureException = Sentry.captureException;
 *   export const setUser = (u) => Sentry.setUser(u ? { id: u.id, email: u.email } : null);
 *   export const clearUser = () => Sentry.setUser(null);
 */

export function initSentry() {}

export function captureException(error, context) {
  console.error('[Error]', error, context);
}

export function setUser(_user) {}

export function clearUser() {}
