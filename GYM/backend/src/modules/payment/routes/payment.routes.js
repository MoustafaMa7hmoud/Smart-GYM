const router         = require('express').Router();
const ctrl           = require('../controller/payment.controller');
const { protect }    = require('../../../middlewares/auth.middleware');
const { restrictTo } = require('../../../middlewares/role.middleware');
const validate       = require('../../../middlewares/validate.middleware');
const { ROLES }      = require('../../../utils/constants');
const { initiatePaymentSchema } = require('../validation/payment.validation');

// ⚠️  Webhook is PUBLIC — Paymob calls it server-to-server with HMAC auth
router.post('/webhook', ctrl.webhook);

router.use(protect);

router.post('/initiate', validate(initiatePaymentSchema), ctrl.initiatePayment);
router.get('/my',        ctrl.getMyPayments);
router.get('/',          restrictTo(ROLES.ADMIN), ctrl.getAllPayments);

module.exports = router;
