const crypto             = require('crypto');
const User               = require('../model/user.model');
const ApiFeatures        = require('../../../utils/apiFeatures');
const cloudinaryService  = require('../../../integrations/cloudinary.service');
const ApiError           = require('../../../utils/ApiError');
const logger             = require('../../../utils/logger');

const ensureQrToken = async (user) => {
  if (!user || user.qrToken) return user;
  user.qrToken = crypto.randomUUID();
  await user.save();
  return user;
};

const getProfile = async (userId) => {
  const user = await User.findById(userId)
    .select('fullName email phone goal level role profileImage dateOfBirth gender isActive lastLogin qrToken')
    .populate({ path: 'favoriteExercises', select: 'name muscle level image', options: { lean: true } });
  if (!user) throw new ApiError(404, 'User not found.');
  await ensureQrToken(user);
  return user;
};

const updateProfile = async (userId, updates) => {
  const allowed = ['fullName', 'phone', 'goal', 'level'];
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  );
  if (Object.keys(filtered).length === 0) {
    throw new ApiError(400, 'No valid profile fields provided.');
  }
  const user = await User.findByIdAndUpdate(userId, filtered, {
    new: true, runValidators: true,
  })
    .select('fullName email phone goal level role profileImage dateOfBirth gender isActive lastLogin qrToken')
    .populate({ path: 'favoriteExercises', select: 'name muscle level image', options: { lean: true } });
  if (!user) throw new ApiError(404, 'User not found.');
  await ensureQrToken(user);
  logger.info(`User profile updated: ${userId}`);
  return user;
};

const updateAvatar = async (userId, file) => {
  if (!file) throw new ApiError(400, 'No file provided.');
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found.');

  const oldPublicId = user.profileImage?.publicId
    || cloudinaryService.extractPublicId(user.profileImage?.url);
  if (oldPublicId) {
    await cloudinaryService.deleteAsset(oldPublicId, 'image');
  }

  user.profileImage = {
    url: file.path,
    publicId: file.filename,
  };
  await user.save();
  logger.info(`Avatar updated for user: ${userId}`);

  return User.findById(userId)
    .select('fullName email phone goal level role profileImage dateOfBirth gender isActive lastLogin qrToken')
    .populate({ path: 'favoriteExercises', select: 'name muscle level image', options: { lean: true } });
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new ApiError(404, 'User not found.');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new ApiError(400, 'Current password is incorrect.');

  user.password = newPassword;
  await user.save();
  logger.info(`Password changed for user: ${userId}`);
};

const addFavoriteExercise = async (userId, exerciseId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { favoriteExercises: exerciseId } },
    { new: true }
  ).populate('favoriteExercises', 'name muscle level image');
  if (!user) throw new ApiError(404, 'User not found.');
  return user;
};

const removeFavoriteExercise = async (userId, exerciseId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $pull: { favoriteExercises: exerciseId } },
    { new: true }
  ).populate('favoriteExercises', 'name muscle level image');
  if (!user) throw new ApiError(404, 'User not found.');
  return user;
};

// Admin: list all users with full ApiFeatures
const getAllUsers = async (queryString) => {
  const features = new ApiFeatures(User.find(), queryString)
    .filter()
    .search(['fullName', 'email'])
    .sort()
    .limitFields()
    .paginate();

  const [users, total] = await Promise.all([
    features.query.exec(),
    features.count(),
  ]);

  return { total, ...features.meta, users };
};

const getUserById = async (id) => {
  const user = await User.findById(id).populate('favoriteExercises', 'name muscle level');
  if (!user) throw new ApiError(404, 'User not found.');
  return user;
};

const deactivateUser = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: false },
    { new: true }
  );
  if (!user) throw new ApiError(404, 'User not found.');
  logger.warn(`User deactivated: ${userId}`);
  return user;
};

const activateUser = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: true },
    { new: true }
  );
  if (!user) throw new ApiError(404, 'User not found.');
  logger.info(`User activated: ${userId}`);
  return user;
};

module.exports = {
  ensureQrToken,
  getProfile,
  updateProfile,
  updateAvatar,
  changePassword,
  addFavoriteExercise,
  removeFavoriteExercise,
  getAllUsers,
  getUserById,
  deactivateUser,
  activateUser,
};
