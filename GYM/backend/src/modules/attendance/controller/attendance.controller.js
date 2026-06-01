const attendanceService = require('../service/attendance.service');
const User              = require('../../user/model/user.model');
const catchAsync        = require('../../../utils/catchAsync');
const ApiResponse       = require('../../../utils/ApiResponse');
const ApiError          = require('../../../utils/ApiError');
const { HTTP }          = require('../../../utils/constants');

const checkIn = catchAsync(async (req, res) => {
  const log = await attendanceService.checkIn(req.user._id);
  res.status(HTTP.CREATED).json(new ApiResponse(HTTP.CREATED, log, 'Checked in successfully.'));
});

const qrCheckIn = catchAsync(async (req, res) => {
  const { qrToken, notes } = req.body;
  const user = await User.findOne({ qrToken });
  if (!user) throw new ApiError(404, 'Invalid QR code.');
  const log = await attendanceService.checkIn(user._id, notes);
  res.status(HTTP.CREATED).json(new ApiResponse(HTTP.CREATED, log, 'Checked in successfully.'));
});

const checkOut = catchAsync(async (req, res) => {
  const log = await attendanceService.checkOut(req.user._id);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, log, 'Checked out successfully.'));
});

const getMyAttendance = catchAsync(async (req, res) => {
  const result = await attendanceService.getMyAttendance(req.user._id, req.query);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, result.items, 'Attendance list retrieved.', result.meta));
});

const getAttendanceStats = catchAsync(async (req, res) => {
  const stats = await attendanceService.getAttendanceStats(req.user._id);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, stats));
});

const getAllAttendance = catchAsync(async (req, res) => {
  const result = await attendanceService.getAllAttendance(req.query);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, result));
});

module.exports = { checkIn, qrCheckIn, checkOut, getMyAttendance, getAttendanceStats, getAllAttendance };
