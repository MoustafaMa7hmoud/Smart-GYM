const jwt = require('jsonwebtoken');
const { TOKEN_TYPES, JWT_CONFIG } = require('./constants');

/**
 * Sign a JWT access token (short-lived: 15 min default).
 */
const generateAccessToken = (payload) =>
  jwt.sign(
    { ...payload, type: TOKEN_TYPES.ACCESS },
    process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
    { expiresIn: JWT_CONFIG.ACCESS_EXPIRES }
  );

/**
 * Sign a JWT refresh token (long-lived: 7 days default).
 * Includes a `version` field so all tokens for a user can be invalidated
 * by bumping the user's tokenVersion in the DB.
 */
const generateRefreshToken = (payload) =>
  jwt.sign(
    { ...payload, type: TOKEN_TYPES.REFRESH },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: JWT_CONFIG.REFRESH_EXPIRES }
  );

/**
 * Attach the refresh token as an HttpOnly, Secure cookie.
 * The access token is returned in the response body only.
 */
const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge:   JWT_CONFIG.COOKIE_MAX_AGE,
    path:     '/api/v1/auth', // cookie only sent to auth endpoints
  });
};

/**
 * Clear the refresh token cookie (used on logout).
 */
const clearRefreshCookie = (res) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    expires:  new Date(0),
    path:     '/api/v1/auth',
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
};
