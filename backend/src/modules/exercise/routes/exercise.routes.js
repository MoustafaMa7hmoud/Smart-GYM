const router         = require('express').Router();
const ctrl           = require('../controller/exercise.controller');
const { protect }    = require('../../../middlewares/auth.middleware');
const { restrictTo } = require('../../../middlewares/role.middleware');
const validate       = require('../../../middlewares/validate.middleware');
const { uploadVideo } = require('../../../utils/upload');
const { ROLES }       = require('../../../utils/constants');
const { createExerciseSchema, updateExerciseSchema } = require('../validation/exercise.validation');

// Allow both image and video upload fields in one request
const upload = uploadVideo.fields([
  { name: 'video', maxCount: 1 },
  { name: 'image', maxCount: 1 },
]);

// Public
router.get('/',    ctrl.getAllExercises);
router.get('/:id', ctrl.getExerciseById);

// Protected
router.use(protect);

router.post(
  '/',
  restrictTo(ROLES.ADMIN, ROLES.TRAINER),
  upload,
  validate(createExerciseSchema),
  ctrl.createExercise
);
router.patch(
  '/:id',
  restrictTo(ROLES.ADMIN, ROLES.TRAINER),
  upload,
  validate(updateExerciseSchema),
  ctrl.updateExercise
);
router.delete('/:id', restrictTo(ROLES.ADMIN), ctrl.deleteExercise);

module.exports = router;
