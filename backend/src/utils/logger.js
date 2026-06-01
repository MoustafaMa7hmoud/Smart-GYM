const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs   = require('fs');

// Ensure logs directory exists at startup
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const { combine, timestamp, printf, colorize, errors, json, splat } = format;

// ── Human-readable format for console / dev ───────────────────────────────
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  splat(),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} [${level}]: ${stack || message}${extra}`;
  })
);

// ── Structured JSON format for files / production ─────────────────────────
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  splat(),
  json()
);

const isProduction = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level:       isProduction ? 'info' : 'debug',
  format:      prodFormat,
  defaultMeta: { service: 'smart-gym-api' },
  transports: [
    // ── Console ─────────────────────────────────────────────────────────
    new transports.Console({
      format: isProduction ? prodFormat : devFormat,
      silent: process.env.NODE_ENV === 'test',
    }),

    // ── Error-only rotating file ─────────────────────────────────────────
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level:    'error',
      maxsize:  10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
      tailable: true,
    }),

    // ── Combined (all levels) rotating file ──────────────────────────────
    new transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize:  20 * 1024 * 1024, // 20 MB
      maxFiles: 10,
      tailable: true,
    }),
  ],
  exitOnError: false,
});

// ── Convenience helpers ───────────────────────────────────────────────────
logger.logRequest = (req) => {
  logger.http(`${req.method} ${req.originalUrl}`, {
    ip:        req.ip,
    userAgent: req.get('user-agent'),
    userId:    req.user?._id ?? 'anon',
  });
};

logger.logResponse = (req, res, duration) => {
  const level = res.statusCode >= 500 ? 'error'
              : res.statusCode >= 400 ? 'warn'
              : 'http';
  logger.log(level, `${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`, {
    statusCode: res.statusCode,
    duration,
    userId:     req.user?._id ?? 'anon',
  });
};

module.exports = logger;
