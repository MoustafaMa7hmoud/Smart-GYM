const ApiError = require('../utils/ApiError');
const { PERMISSIONS, ERROR_CODES } = require('../utils/constants');

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  restrictTo — Role-Based Access Control middleware (simple role check).
 *
 *  Usage:  restrictTo('admin', 'trainer')
 *
 *  Must be used AFTER `protect` (relies on req.user).
 * ─────────────────────────────────────────────────────────────────────────────
 */
const restrictTo = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required.', ERROR_CODES.TOKEN_MISSING));
  }
  if (!roles.includes(req.user.role) && !(req.user.role === 'superAdmin' && roles.includes('admin'))) {
    return next(
      new ApiError(
        403,
        `Access denied. Requires one of: [${roles.join(', ')}]`,
        ERROR_CODES.FORBIDDEN
      )
    );
  }
  next();
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  authorize — Permission-based access control.
 *
 *  Checks against the PERMISSIONS map in constants.js.
 *  Usage:  authorize('WRITE_EXERCISE')
 *
 *  Allows finer-grained control than role-only checks.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const authorize = (permission) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required.', ERROR_CODES.TOKEN_MISSING));
  }

  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) {
    // Unknown permission key — fail closed
    return next(new ApiError(403, `Unknown permission: ${permission}`, ERROR_CODES.FORBIDDEN));
  }

  const allowed =
    allowedRoles.includes(req.user.role) ||
    (req.user.role === 'superAdmin' && allowedRoles.includes('admin'));
  if (!allowed) {
    return next(
      new ApiError(
        403,
        'You do not have permission to perform this action.',
        ERROR_CODES.FORBIDDEN
      )
    );
  }
  next();
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ownerOrAdmin — Ownership check.
 *
 *  Passes if:
 *    • req.user is an admin, OR
 *    • req.user._id matches the resourceUserId extracted by `getResourceUserId`
 *
 *  @param {function} getResourceUserId  - (req) => string | ObjectId
 *                                         Function that returns the owner's user ID
 *                                         from the request (e.g. from params or body).
 *
 *  Usage:
 *    router.delete('/:id', protect, ownerOrAdmin((req) => req.params.userId), ctrl.delete)
 * ─────────────────────────────────────────────────────────────────────────────
 */
const ownerOrAdmin = (getResourceUserId) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required.', ERROR_CODES.TOKEN_MISSING));
  }

  const resourceUserId = getResourceUserId(req);
  const isAdmin        = req.user.role === 'admin' || req.user.role === 'superAdmin';
  const isOwner        = String(req.user._id) === String(resourceUserId);

  if (!isAdmin && !isOwner) {
    return next(
      new ApiError(
        403,
        'You can only access your own resources.',
        ERROR_CODES.NOT_OWNER
      )
    );
  }
  next();
};

module.exports = { restrictTo, authorize, ownerOrAdmin };
