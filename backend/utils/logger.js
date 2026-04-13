/**
 * Structured JSON logger — production-ready, log-aggregator friendly.
 *
 * In development (NODE_ENV !== 'production') logs are pretty-printed.
 * In production they are emitted as single-line JSON so tools like
 * CloudWatch, Datadog, or Logtail can parse them natively.
 */

const isProd = process.env.NODE_ENV === 'production';

function write(level, message, data = null) {
  const entry = {
    level,
    time: new Date().toISOString(),
    msg: message,
    ...(data && { data }),
    ...(process.env.SERVICE_NAME && { service: process.env.SERVICE_NAME }),
    env: process.env.NODE_ENV || 'development',
  };

  if (isProd) {
    process.stdout.write(JSON.stringify(entry) + '\n');
  } else {
    // Human-readable for local dev
    const COLORS = { info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m', debug: '\x1b[35m', success: '\x1b[32m' };
    const ICONS  = { info: 'ℹ', warn: '⚠', error: '✖', debug: '●', success: '✔' };
    const reset  = '\x1b[0m';
    const color  = COLORS[level] ?? '';
    const icon   = ICONS[level]  ?? '·';
    const extra  = data ? ' ' + JSON.stringify(data) : '';
    const fn     = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(`${color}[${entry.time}] ${icon}  ${message}${extra}${reset}`);
  }
}

export const logger = {
  info:    (msg, data) => write('info',    msg, data),
  warn:    (msg, data) => write('warn',    msg, data),
  error:   (msg, data) => {
    if (data instanceof Error) {
      write('error', msg, { message: data.message, stack: isProd ? undefined : data.stack });
    } else {
      write('error', msg, data);
    }
  },
  debug:   (msg, data) => {
    if (process.env.LOG_LEVEL === 'debug') write('debug', msg, data);
  },
  success: (msg, data) => write('success', msg, data),
  http:    (req, res, duration) => write('info', 'http', {
    method:     req.method,
    url:        req.originalUrl,
    status:     res.statusCode,
    duration_ms: duration,
    ip:         req.ip,
    ua:         req.get('user-agent'),
  }),
};

export default logger;
