const authService = require('../service/auth.service');
const catchAsync  = require('../../../utils/catchAsync');
const ApiResponse = require('../../../utils/ApiResponse');
const { HTTP }    = require('../../../utils/constants');

const register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(HTTP.CREATED).json(new ApiResponse(HTTP.CREATED, result, 'Registration successful.'));
});

const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, result, 'Login successful.'));
});

const getMe = catchAsync(async (req, res) => {
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, req.user, 'Authenticated user.'));
});

module.exports = { register, login, getMe };
