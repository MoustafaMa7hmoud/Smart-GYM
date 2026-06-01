const router         = require('express').Router();
const ctrl           = require('../controller/subscription.controller');
const { protect }    = require('../../../middlewares/auth.middleware');
const { restrictTo } = require('../../../middlewares/role.middleware');
const validate       = require('../../../middlewares/validate.middleware');
const { ROLES }      = require('../../../utils/constants');
const { createSubscriptionSchema } = require('../validation/subscription.validation');

// Public: plan catalogue
router.get('/plans', ctrl.getPlanCatalogue);

router.use(protect);

router.post('/',            validate(createSubscriptionSchema), ctrl.createSubscription);
router.get('/my',           ctrl.getMySubscription);
router.patch('/:id/cancel', ctrl.cancelSubscription);
router.get('/',             restrictTo(ROLES.ADMIN), ctrl.getAllSubscriptions);

module.exports = router;
