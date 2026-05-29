const router         = require('express').Router();
const ctrl           = require('../controller/user.controller');
const { protect }    = require('../../../middlewares/auth.middleware');
const { restrictTo } = require('../../../middlewares/role.middleware');
const validate       = require('../../../middlewares/validate.middleware');
const { uploadAvatar } = require('../../../utils/upload');
const { ROLES }      = require('../../../utils/constants');
const { updateProfileSchema, changePasswordSchema } = require('../validation/user.validation');

router.use(protect);

// Own profile
router.get('/profile',  ctrl.getProfile);
router.patch('/profile', validate(updateProfileSchema), ctrl.updateProfile);
router.patch('/avatar',  uploadAvatar.single('avatar'), ctrl.updateAvatar);
router.patch('/change-password', validate(changePasswordSchema), ctrl.changePassword);

// Favourites
router.post('/favorites/:exerciseId',   ctrl.addFavorite);
router.delete('/favorites/:exerciseId', ctrl.removeFavorite);

// Admin
router.get('/',                restrictTo(ROLES.ADMIN), ctrl.getAllUsers);
router.get('/:id',             restrictTo(ROLES.ADMIN), ctrl.getUserById);
router.patch('/:id/deactivate', restrictTo(ROLES.ADMIN), ctrl.deactivateUser);
router.patch('/:id/activate',   restrictTo(ROLES.ADMIN), ctrl.activateUser);

module.exports = router;
