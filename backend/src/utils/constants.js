/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Global constants — single source of truth for all enums used in the system.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Roles ─────────────────────────────────────────────────────────────────────
const ROLES = Object.freeze({
  USER:    'user',
  TRAINER: 'trainer',
  ADMIN:   'admin',
});

// ── RBAC: which roles can do what ─────────────────────────────────────────────
// Used by the `authorize` middleware for fine-grained checks.
const PERMISSIONS = Object.freeze({
  // User management
  READ_ANY_USER:    [ROLES.ADMIN],
  WRITE_ANY_USER:   [ROLES.ADMIN],
  DELETE_ANY_USER:  [ROLES.ADMIN],

  // Trainer management
  READ_ANY_TRAINER: [ROLES.ADMIN, ROLES.TRAINER, ROLES.USER],
  WRITE_TRAINER:    [ROLES.ADMIN, ROLES.TRAINER],
  DELETE_TRAINER:   [ROLES.ADMIN],

  // Exercise management
  WRITE_EXERCISE:   [ROLES.ADMIN, ROLES.TRAINER],
  DELETE_EXERCISE:  [ROLES.ADMIN],

  // Machine management
  WRITE_MACHINE:    [ROLES.ADMIN],
  DELETE_MACHINE:   [ROLES.ADMIN],

  // Workout plans
  GENERATE_PLAN:    [ROLES.ADMIN, ROLES.TRAINER, ROLES.USER],
  WRITE_ANY_PLAN:   [ROLES.ADMIN, ROLES.TRAINER],

  // Subscriptions
  READ_ALL_SUBS:    [ROLES.ADMIN],

  // Payments
  READ_ALL_PAYMENTS: [ROLES.ADMIN],

  // Attendance
  READ_ALL_ATTENDANCE: [ROLES.ADMIN],
});

// ── User goals & fitness levels ───────────────────────────────────────────────
const GOALS = Object.freeze({
  WEIGHT_LOSS:  'weight_loss',
  MUSCLE_GAIN:  'muscle_gain',
  FITNESS:      'fitness',
});

const LEVELS = Object.freeze({
  BEGINNER:     'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED:     'advanced',
});

// ── Exercise categories ───────────────────────────────────────────────────────
const EXERCISE_CATEGORIES = Object.freeze({
  STRENGTH:    'strength',
  CARDIO:      'cardio',
  FLEXIBILITY: 'flexibility',
  BALANCE:     'balance',
});

// ── Subscription ──────────────────────────────────────────────────────────────
const SUBSCRIPTION_PLANS = Object.freeze({
  BASIC:    'basic',
  STANDARD: 'standard',
  PREMIUM:  'premium',
});

const SUBSCRIPTION_STATUSES = Object.freeze({
  ACTIVE:    'active',
  EXPIRED:   'expired',
  CANCELLED: 'cancelled',
  PENDING:   'pending',
});

// ── Payment ───────────────────────────────────────────────────────────────────
const PAYMENT_STATUSES = Object.freeze({
  PENDING:  'pending',
  SUCCESS:  'success',
  FAILED:   'failed',
  REFUNDED: 'refunded',
});

// ── Token types ───────────────────────────────────────────────────────────────
const TOKEN_TYPES = Object.freeze({
  ACCESS:  'access',
  REFRESH: 'refresh',
});

// ── JWT config ────────────────────────────────────────────────────────────────
const JWT_CONFIG = Object.freeze({
  ACCESS_EXPIRES:  process.env.JWT_ACCESS_EXPIRES  || '15m',
  REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',
  COOKIE_MAX_AGE:  7 * 24 * 60 * 60 * 1000, // 7 days in ms
});

// ── Workout plan creation sources ─────────────────────────────────────────────
const PLAN_CREATED_BY = Object.freeze({
  AUTO:    'auto',
  TRAINER: 'trainer',
  ADMIN:   'admin',
});

// ── Cloudinary upload folders ─────────────────────────────────────────────────
const CLOUDINARY_FOLDERS = Object.freeze({
  AVATARS: 'smart-gym/avatars',
  IMAGES:  'smart-gym/images',
  VIDEOS:  'smart-gym/videos',
});

// ── Pagination defaults ───────────────────────────────────────────────────────
const PAGINATION = Object.freeze({
  DEFAULT_PAGE:  1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT:     100,
});

// ── HTTP status codes ─────────────────────────────────────────────────────────
const HTTP = Object.freeze({
  OK:           200,
  CREATED:      201,
  NO_CONTENT:   204,
  BAD_REQUEST:  400,
  UNAUTHORIZED: 401,
  FORBIDDEN:    403,
  NOT_FOUND:    404,
  CONFLICT:     409,
  TOO_MANY:     429,
  SERVER_ERROR: 500,
  BAD_GATEWAY:  502,
});

// ── Application-level error codes (for client-side handling) ──────────────────
const ERROR_CODES = Object.freeze({
  // Auth
  TOKEN_MISSING:   'TOKEN_MISSING',
  TOKEN_INVALID:   'TOKEN_INVALID',
  TOKEN_EXPIRED:   'TOKEN_EXPIRED',
  REFRESH_INVALID: 'REFRESH_INVALID',
  ACCOUNT_INACTIVE:'ACCOUNT_INACTIVE',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_TAKEN:     'EMAIL_TAKEN',
  // Access
  FORBIDDEN:       'FORBIDDEN',
  NOT_OWNER:       'NOT_OWNER',
  // Resources
  NOT_FOUND:       'NOT_FOUND',
  CONFLICT:        'CONFLICT',
  // Validation
  VALIDATION_ERROR:'VALIDATION_ERROR',
  // Server
  INTERNAL_ERROR:  'INTERNAL_ERROR',
});

module.exports = {
  ROLES,
  PERMISSIONS,
  GOALS,
  LEVELS,
  EXERCISE_CATEGORIES,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUSES,
  PAYMENT_STATUSES,
  TOKEN_TYPES,
  JWT_CONFIG,
  PLAN_CREATED_BY,
  CLOUDINARY_FOLDERS,
  PAGINATION,
  HTTP,
  ERROR_CODES,
};
