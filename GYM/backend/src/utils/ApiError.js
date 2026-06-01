const { ERROR_CODES } = require('./constants');

/**
 * Operational API error — safe to expose to the client.
 *
 * @param {number}  statusCode   HTTP status code
 * @param {string}  message      Human-readable message
 * @param {string}  errorCode    Machine-readable code from ERROR_CODES (optional)
 * @param {object}  meta         Extra data to attach (optional)
 */
class ApiError extends Error {
  constructor(
    statusCode,
    message,
    errorCode = ERROR_CODES.INTERNAL_ERROR,
    meta      = null
  ) {
    super(message);
    this.name        = 'ApiError';
    this.statusCode  = statusCode;
    this.errorCode   = errorCode;
    this.meta        = meta;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  // ── Convenience factories ─────────────────────────────────────────────

  static badRequest(msg, code = ERROR_CODES.VALIDATION_ERROR) {
    return new ApiError(400, msg, code);
  }

  static unauthorized(msg = 'Not authenticated.', code = ERROR_CODES.TOKEN_INVALID) {
    return new ApiError(401, msg, code);
  }

  static forbidden(msg = 'Access denied.', code = ERROR_CODES.FORBIDDEN) {
    return new ApiError(403, msg, code);
  }

  static notFound(resource = 'Resource') {
    return new ApiError(404, `${resource} not found.`, ERROR_CODES.NOT_FOUND);
  }

  static conflict(msg, code = ERROR_CODES.CONFLICT) {
    return new ApiError(409, msg, code);
  }
}

module.exports = ApiError;
