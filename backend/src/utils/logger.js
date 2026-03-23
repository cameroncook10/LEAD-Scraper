/**
 * Logger utility for trading bot
 * Simple structured logging for all services
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  constructor(level = process.env.LOG_LEVEL || 'info') {
    this.level = LOG_LEVELS[level] || LOG_LEVELS.info;
  }

  log(level, message, data = {}) {
    if (LOG_LEVELS[level] < this.level) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...data,
    };

    console.log(JSON.stringify(logEntry));
  }

  debug(message, data) {
    this.log('debug', message, data);
  }

  info(message, data) {
    this.log('info', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  error(message, error) {
    const data =
      error instanceof Error
        ? { error: error.message, stack: error.stack }
        : { error: String(error) };
    this.log('error', message, data);
  }
}

export const logger = new Logger();
