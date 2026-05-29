const User               = require('../model/user.model');
const ApiFeatures        = require('../../../utils/apiFeatures');
const cloudinaryService  = require('../../../integrations/cloudinary.service');
const ApiError           = require('../../../utils/ApiError');
const logger             = require('../../../utils/logger');

const getProfile = async (userId) => {
  const user = await User.findById(userId)
    .select('fullName email role profileImage dateOfBirth gender isActive lastLogin')
    .populate({ path: 'favoriteExercises', select: 'name muscle level image', options: { lean: true } });
  if (!user) throw new ApiError(404, 'User not found.');
  return user;
};

const updateProfile = async (userId, updates) => {
  const allowed = ['name', 'phone', 'goal', 'level'];
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  );
  const user = await User.findByIdAndUpdate(userId, filtered, {
    new: true, runValidators: true,
  });
  if (!user) throw new ApiError(404, 'User not found.');
  logger.info(`User profile updated: ${userId}`);
  return user;
};

const updateAvatar = async (userId, file) => {
  if (!file) throw new ApiError(400, 'No file provided.');
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found.');

  // Delete old avatar
  if (user.avatar) {
    const oldPublicId = cloudinaryService.extractPublicId(user.avatar);
    await cloudinaryService.deleteAsset(oldPublicId, 'image');
  }

  user.avatar = file.path;
  await user.save();
  logger.info(`Avatar updated for user: ${userId}`);
  return user;
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
    .search(['name', 'email'])
    .sort()
    .limitFields()
    .paginate();

  const [users, total] = await Promise.all([
    features.query,
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
