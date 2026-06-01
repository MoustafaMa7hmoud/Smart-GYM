const logger = require('../utils/logger');
const { HTTP, ERROR_CODES } = require('../utils/constants');

// ── Mongoose / Driver error normalisers ──────────────────────────────────
const handleCastError = (err) => ({
  statusCode: HTTP.BAD_REQUEST,
  errorCode:  ERROR_CODES.VALIDATION_ERROR,
  message:    `Invalid value for field '${err.path}': ${err.value}`,
});

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue?.[field];
  return {
    statusCode: HTTP.CONFLICT,
    errorCode:  ERROR_CODES.CONFLICT,
    message:    `'${value}' is already taken for field '${field}'.`,
  };
};

const handleValidationError = (err) => ({
  statusCode: HTTP.BAD_REQUEST,
  errorCode:  ERROR_CODES.VALIDATION_ERROR,
  message:    Object.values(err.errors).map((e) => e.message).join('; '),
});

const handleJWTError = () => ({
  statusCode: HTTP.UNAUTHORIZED,
  errorCode:  ERROR_CODES.TOKEN_INVALID,
  message:    'Invalid or malformed token. Please log in again.',
});

const handleJWTExpiredError = () => ({
  statusCode: HTTP.UNAUTHORIZED,
  errorCode:  ERROR_CODES.TOKEN_EXPIRED,
  message:    'Your session has expired. Please log in again.',
});

// ── Global error handler ──────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, _next) => {
  let statusCode = err.statusCode || HTTP.SERVER_ERROR;
  let message    = err.message    || 'Internal Server Error';
  let errorCode  = err.errorCode  || ERROR_CODES.INTERNAL_ERROR;
  let meta       = err.meta       || null;

  // Normalise known error types
  if (err.name === 'CastError')          ({ statusCode, errorCode, message } = handleCastError(err));
  if (err.code  === 11000)               ({ statusCode, errorCode, message } = handleDuplicateKeyError(err));
  if (err.name  === 'ValidationError')   ({ statusCode, errorCode, message } = handleValidationError(err));
  if (err.name  === 'JsonWebTokenError') ({ statusCode, errorCode, message } = handleJWTError());
  if (err.name  === 'TokenExpiredError') ({ statusCode, errorCode, message } = handleJWTExpiredError());

  // ── Logging ───────────────────────────────────────────────────────────
  if (statusCode >= HTTP.SERVER_ERROR) {
    logger.error(`[${req.method}] ${req.originalUrl} → ${statusCode}`, {
      errorCode, message, stack: err.stack,
      userId: req.user?._id ?? 'anon',
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} → ${statusCode} [${errorCode}]: ${message}`, {
      userId: req.user?._id ?? 'anon',
    });
  }

  // ── Response ──────────────────────────────────────────────────────────
  const body = {
    success:   false,
    errorCode,
    message,
    ...(meta && { errors: meta.errors }),
    ...(process.env.NODE_ENV === 'development' && {
      stack:  err.stack,
    }),
  };

  res.status(statusCode).json(body);
};

module.exports = errorMiddleware;
