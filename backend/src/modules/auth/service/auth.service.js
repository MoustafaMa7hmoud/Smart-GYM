const crypto        = require('crypto');
const User          = require('../../../modules/user/model/user.model');
const { ensureQrToken } = require('../../user/service/user.service');
const { generateAccessToken } = require('../../../utils/generateToken');
const { ROLES }     = require('../../../utils/constants');
const ApiError      = require('../../../utils/ApiError');
const logger        = require('../../../utils/logger');

const toSafeUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  qrToken: user.qrToken,
});

/**
 * Register a new user account.
 */
const register = async ({ fullName, email, password, role, phone, gender, dateOfBirth }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists.');

  // Guard: only allow user/trainer roles via public API
  const safeRole = role === ROLES.TRAINER ? ROLES.TRAINER : ROLES.USER;
  const qrToken  = crypto.randomUUID();

  const user  = await User.create({ fullName, email, password, role: safeRole, phone, gender, dateOfBirth, qrToken });
  const token = generateAccessToken({ id: user._id, role: user.role });

  logger.info(`New user registered: ${user.email} (${user.role})`);

  return {
    token,
    user: toSafeUser(user),
  };
};

/**
 * Authenticate with email & password → return JWT.
 */
const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid email or password.');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password.');

  if (!user.isActive)
    throw new ApiError(403, 'Your account has been deactivated. Please contact support.');

  await ensureQrToken(user);
  const token = generateAccessToken({ id: user._id, role: user.role });

  logger.info(`User logged in: ${user.email}`);

  return {
    token,
    user: toSafeUser(user),
  };
};

module.exports = { register, login };