require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const errorMiddleware = require('./middlewares/error.middleware');
const ApiError        = require('./utils/ApiError');
const routes          = require('./routes/index');
const logger          = require('./utils/logger');

const app = express();

// ── 1. Security headers ───────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  })
);

// ── 2. CORS ───────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CLIENT_ORIGINS
  ? process.env.CLIENT_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (process.env.NODE_ENV !== 'production') return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods:          ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders:   ['Content-Type', 'Authorization'],
    exposedHeaders:   ['X-Total-Count', 'X-Page', 'X-Limit'],
    credentials:      true,
    optionsSuccessStatus: 204,
  })
);

// ── 3. Rate limiting ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' }),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({ success: false, message: 'Too many auth attempts. Please try again in 15 minutes.' }),
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  handler: (_req, res) =>
    res.status(429).json({ success: false, message: 'Upload limit reached. Try again later.' }),
});

app.use('/api', globalLimiter);
app.use('/api/v1/auth',      authLimiter);
app.use('/api/v1/exercises', uploadLimiter);
app.use('/api/v1/machines',  uploadLimiter);

// ── 4. Body parsers ───────────────────────────────────────────────────────
// Raw body MUST be registered before express.json() for Paymob webhook
app.use(
  '/api/v1/payments/webhook',
  express.raw({ type: ['application/json', 'text/plain'] })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── 5. Request timing ─────────────────────────────────────────────────────
app.use((req, _res, next) => {
  req._startTime = Date.now();
  next();
});

// ── 6. HTTP request logging ───────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan(
      process.env.NODE_ENV === 'production'
        ? ':remote-addr :method :url :status :res[content-length] - :response-time ms'
        : 'dev',
      { stream: { write: (msg) => logger.http(msg.trim()) } }
    )
  );
}

// ── 7. Health check ───────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status:      'ok',
    environment: process.env.NODE_ENV,
    timestamp:   new Date().toISOString(),
    uptime:      `${Math.floor(process.uptime())}s`,
  });
});

// ── 8. API routes ─────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ── 9. 404 handler ────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  next(new ApiError(404, `Cannot ${req.method} ${req.originalUrl}`));
});

// ── 10. Global error handler ──────────────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
