const router      = require('express').Router();
const ctrl        = require('../controller/workoutPlan.controller');
const { protect } = require('../../../middlewares/auth.middleware');
const validate    = require('../../../middlewares/validate.middleware');
const { generatePlanSchema, updatePlanSchema } = require('../validation/workoutPlan.validation');

router.use(protect);

router.post('/generate', validate(generatePlanSchema), ctrl.generatePlan);
router.get('/',          ctrl.getMyPlans);
router.get('/:id',       ctrl.getPlanById);
router.patch('/:id',     validate(updatePlanSchema), ctrl.updatePlan);
router.delete('/:id',    ctrl.deletePlan);

module.exports = router;
