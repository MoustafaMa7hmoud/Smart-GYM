const jwt      = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const User     = require('../modules/user/model/user.model');
const { TOKEN_TYPES, ERROR_CODES } = require('../utils/constants');
const logger   = require('../utils/logger');

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  protect — Authentication middleware
 *
 *  Validates the Bearer access token and attaches the user to req.user.
 *  Checks performed (in order):
 *    1. Token present in Authorization header
 *    2. Token signature is valid
 *    3. Token type is 'access' (not a refresh token)
 *    4. User still exists in DB
 *    5. User account is active
 *    6. Password has not changed since token was issued
 * ─────────────────────────────────────────────────────────────────────────────
 */
const protect = catchAsync(async (req, _res, next) => {
  // ── 1. Extract token ──────────────────────────────────────────────────
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(
      401,
      'Authentication required. Please provide a Bearer token.',
      ERROR_CODES.TOKEN_MISSING
    );
  }

  // ── 2. Verify signature ───────────────────────────────────────────────
  let decoded;
  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET
    );
  } catch (err) {
    const code = err.name === 'TokenExpiredError'
      ? ERROR_CODES.TOKEN_EXPIRED
      : ERROR_CODES.TOKEN_INVALID;
    const msg  = err.name === 'TokenExpiredError'
      ? 'Your session has expired. Please log in again.'
      : 'Invalid token. Please log in again.';
    throw new ApiError(401, msg, code);
  }

  // ── 3. Ensure it's an access token (not a refresh token) ─────────────
  if (decoded.type !== TOKEN_TYPES.ACCESS) {
    throw new ApiError(
      401,
      'Invalid token type.',
      ERROR_CODES.TOKEN_INVALID
    );
  }

  // ── 4. User still exists ──────────────────────────────────────────────
  const user = await User.findById(decoded.id).select('+passwordChangedAt');
  if (!user) {
    throw new ApiError(
      401,
      'The account belonging to this token no longer exists.',
      ERROR_CODES.TOKEN_INVALID
    );
  }

  // ── 5. Account is active ──────────────────────────────────────────────
  if (!user.isActive) {
    throw new ApiError(
      403,
      'Your account has been deactivated. Please contact support.',
      ERROR_CODES.ACCOUNT_INACTIVE
    );
  }

  // ── 6. Password not changed since token was issued ────────────────────
  if (user.changedPasswordAfter(decoded.iat)) {
    throw new ApiError(
      401,
      'Your password was recently changed. Please log in again.',
      ERROR_CODES.TOKEN_INVALID
    );
  }

  req.user      = user;
  req.tokenData = decoded;
  next();
});

/**
 * optionalProtect — like `protect` but doesn't fail if no token is present.
 * Useful for public endpoints that behave differently for authenticated users.
 */
const optionalProtect = catchAsync(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();

  try {
    const token   = header.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET
    );
    if (decoded.type === TOKEN_TYPES.ACCESS) {
      const user = await User.findById(decoded.id);
      if (user?.isActive) req.user = user;
    }
  } catch {
    // Ignore invalid tokens in optional mode
  }
  next();
});

module.exports = { protect, optionalProtect };
