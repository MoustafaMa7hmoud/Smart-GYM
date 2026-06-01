const router         = require('express').Router();
const ctrl           = require('../controller/payment.controller');
const { protect }    = require('../../../middlewares/auth.middleware');
const { restrictTo } = require('../../../middlewares/role.middleware');
const validate       = require('../../../middlewares/validate.middleware');
const { ROLES }      = require('../../../utils/constants');
const { initiatePaymentSchema } = require('../validation/payment.validation');

// ⚠️  Webhook is PUBLIC — Paymob calls it server-to-server with HMAC auth
// Supports both GET (query params) and POST (body)
router.get('/webhook', ctrl.webhook);
router.post('/webhook', ctrl.webhook);

router.use(protect);

router.post('/initiate', validate(initiatePaymentSchema), ctrl.initiatePayment);
router.get('/my',        ctrl.getMyPayments);
router.get('/:id', ctrl.getById);
router.get('/',          restrictTo(ROLES.ADMIN), ctrl.getAllPayments);

module.exports = router;
