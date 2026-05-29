const router         = require('express').Router();
const ctrl           = require('../controller/attendance.controller');
const { protect }    = require('../../../middlewares/auth.middleware');
const { restrictTo } = require('../../../middlewares/role.middleware');
const validate       = require('../../../middlewares/validate.middleware');
const { ROLES }      = require('../../../utils/constants');
const { checkInSchema, checkOutSchema } = require('../validation/attendance.validation');

router.use(protect);

router.post('/check-in',   validate(checkInSchema),  ctrl.checkIn);
router.patch('/check-out', validate(checkOutSchema), ctrl.checkOut);
router.get('/my',          ctrl.getMyAttendance);
router.get('/stats',       ctrl.getAttendanceStats);
router.get('/',            restrictTo(ROLES.ADMIN),  ctrl.getAllAttendance);

module.exports = router;
