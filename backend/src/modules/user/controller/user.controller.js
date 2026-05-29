const userService = require('../service/user.service');
const catchAsync  = require('../../../utils/catchAsync');
const ApiResponse = require('../../../utils/ApiResponse');
const { HTTP }    = require('../../../utils/constants');

const getProfile = catchAsync(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, user));
});

const updateProfile = catchAsync(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, user, 'Profile updated successfully.'));
});

const updateAvatar = catchAsync(async (req, res) => {
  const user = await userService.updateAvatar(req.user._id, req.file);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, user, 'Avatar updated successfully.'));
});

const changePassword = catchAsync(async (req, res) => {
  await userService.changePassword(req.user._id, req.body);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, null, 'Password changed successfully.'));
});

const addFavorite = catchAsync(async (req, res) => {
  const user = await userService.addFavoriteExercise(req.user._id, req.params.exerciseId);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, user, 'Exercise added to favourites.'));
});

const removeFavorite = catchAsync(async (req, res) => {
  const user = await userService.removeFavoriteExercise(req.user._id, req.params.exerciseId);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, user, 'Exercise removed from favourites.'));
});

// ── Admin ────────────────────────────────────────────────────────────────
const getAllUsers = catchAsync(async (req, res) => {
  const result = await userService.getAllUsers(req.query);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, result));
});

const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, user));
});

const deactivateUser = catchAsync(async (req, res) => {
  const user = await userService.deactivateUser(req.params.id);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, user, 'User deactivated.'));
});

const activateUser = catchAsync(async (req, res) => {
  const user = await userService.activateUser(req.params.id);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, user, 'User activated.'));
});

module.exports = {
  getProfile, updateProfile, updateAvatar,
  changePassword, addFavorite, removeFavorite,
  getAllUsers, getUserById, deactivateUser, activateUser,
};
