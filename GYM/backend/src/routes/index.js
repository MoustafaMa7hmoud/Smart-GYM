/**
 * Central route aggregator.
 * All modules are mounted here under /api/v1 (prefix set in app.js).
 */
const router = require('express').Router();

router.use('/auth',          require('../modules/auth/routes/auth.routes'));
router.use('/users',         require('../modules/user/routes/user.routes'));
router.use('/trainers',      require('../modules/trainer/routes/trainer.routes'));
router.use('/exercises',     require('../modules/exercise/routes/exercise.routes'));
router.use('/machines',      require('../modules/machine/routes/machine.routes'));
router.use('/workout-plans', require('../modules/workoutPlan/routes/workoutPlan.routes'));
router.use('/progress',      require('../modules/progress/routes/progress.routes'));
router.use('/subscriptions', require('../modules/subscription/routes/subscription.routes'));
// Backwards-compatible singular mount (front-end expects `/subscription/...` in some places)
router.use('/subscription',  require('../modules/subscription/routes/subscription.routes'));
router.use('/payments',      require('../modules/payment/routes/payment.routes'));
router.use('/attendance',    require('../modules/attendance/routes/attendance.routes'));

module.exports = router;
