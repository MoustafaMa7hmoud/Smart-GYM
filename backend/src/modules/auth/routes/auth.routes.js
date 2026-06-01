const router      = require('express').Router();
const ctrl        = require('../controller/auth.controller');
const validate    = require('../../../middlewares/validate.middleware');
const { protect } = require('../../../middlewares/auth.middleware');
const { registerSchema, loginSchema } = require('../validation/auth.validation');

/**
 * POST /api/v1/auth/register  — Create new account
 * POST /api/v1/auth/login     — Login & receive JWT
 * GET  /api/v1/auth/me        — Get current authenticated user
 */
router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login',    validate(loginSchema),    ctrl.login);
router.get('/me',        protect,                  ctrl.getMe);

module.exports = router;
