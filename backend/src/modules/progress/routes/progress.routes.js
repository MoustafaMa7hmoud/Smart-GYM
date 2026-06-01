const router      = require('express').Router();
const ctrl        = require('../controller/progress.controller');
const { protect } = require('../../../middlewares/auth.middleware');
const validate    = require('../../../middlewares/validate.middleware');
const {
  createWorkoutSchema,
  createBodySchema,
} = require('../validation/progress.validation');

router.use(protect);

// Legacy alias support for older clients and direct /progress POST/GET usage
router.post('/',          validate(createWorkoutSchema), ctrl.createWorkoutLog);
router.get('/',           ctrl.getWorkoutProgress);
router.post('/workout',  validate(createWorkoutSchema), ctrl.createWorkoutLog);
router.post('/body',      validate(createBodySchema),   ctrl.createBodyMeasurement);
router.get('/workout',    ctrl.getWorkoutProgress);
router.get('/body',       ctrl.getBodyMeasurements);
router.get('/stats',      ctrl.getStats);
router.delete('/:id',     ctrl.deleteWorkoutLog);

module.exports = router;
