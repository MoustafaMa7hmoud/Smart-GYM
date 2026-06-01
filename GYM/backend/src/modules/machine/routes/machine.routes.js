const router         = require('express').Router();
const ctrl           = require('../controller/machine.controller');
const { protect }    = require('../../../middlewares/auth.middleware');
const { restrictTo } = require('../../../middlewares/role.middleware');
const validate       = require('../../../middlewares/validate.middleware');
const { uploadImage, optionalSingle } = require('../../../utils/upload');
const { ROLES }       = require('../../../utils/constants');
const { createMachineSchema, updateMachineSchema } = require('../validation/machine.validation');

const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'calves', 'fullBody'];

const normalizeMuscleList = (raw) => {
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((s) => String(s).trim()) : [String(parsed).trim()];
  } catch {
    return raw.split(',').map((s) => {
      const x = s.trim().toLowerCase();
      return x === 'fullbody' ? 'fullBody' : x;
    }).filter(Boolean);
  }
};

/** Normalize muscleGroups / category before Joi (JSON + multipart). */
const coerceMachineBody = (req, _res, next) => {
  const body = req.body && typeof req.body === 'object' ? { ...req.body } : {};
  if (body.targetMuscles != null && body.muscleGroups == null) {
    body.muscleGroups = body.targetMuscles;
  }
  const muscles = normalizeMuscleList(body.muscleGroups);
  if (muscles.length) {
    body.muscleGroups = muscles.filter((s) => MUSCLE_GROUPS.includes(s) || s === 'fullBody');
  }
  if (typeof body.category === 'string') {
    body.category = body.category.trim();
  }
  req.body = body;
  next();
};

// Public
router.get('/',    ctrl.getAllMachines);
router.get('/:id', ctrl.getMachineById);

// Protected
router.use(protect);

router.post(
  '/',
  restrictTo(ROLES.ADMIN),
  optionalSingle(uploadImage, 'image'),
  coerceMachineBody,
  validate(createMachineSchema),
  ctrl.createMachine
);
router.patch(
  '/:id',
  restrictTo(ROLES.ADMIN),
  optionalSingle(uploadImage, 'image'),
  coerceMachineBody,
  validate(updateMachineSchema),
  ctrl.updateMachine
);
router.delete('/:id', restrictTo(ROLES.ADMIN), ctrl.deleteMachine);

module.exports = router;
