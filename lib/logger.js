const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'info'] || LOG_LEVELS.info;

function sanitizeLogData(data) {
  if (!data || typeof data !== 'object') return data;
  const sensitive = ['password', 'token', 'secret', 'authorization', 'cookie', 'access_token', 'refresh_token', 'jwt'];
  const clean = { ...data };
  for (const key of Object.keys(clean)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      clean[key] = '[REDACTED]';
    }
  }
  return clean;
}

function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const sanitized = sanitizeLogData(meta);
  const metaStr = Object.keys(sanitized).length > 0 ? ' ' + JSON.stringify(sanitized) : '';
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
}

export const logger = {
  error(message, meta) {
    if (currentLevel >= LOG_LEVELS.error) console.error(formatMessage('error', message, meta));
  },
  warn(message, meta) {
    if (currentLevel >= LOG_LEVELS.warn) console.warn(formatMessage('warn', message, meta));
  },
  info(message, meta) {
    if (currentLevel >= LOG_LEVELS.info) console.log(formatMessage('info', message, meta));
  },
  debug(message, meta) {
    if (currentLevel >= LOG_LEVELS.debug) console.log(formatMessage('debug', message, meta));
  },
};
