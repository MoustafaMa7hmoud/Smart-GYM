const progressService = require('../service/progress.service');
const catchAsync      = require('../../../utils/catchAsync');
const ApiResponse     = require('../../../utils/ApiResponse');
const { HTTP }        = require('../../../utils/constants');

const createWorkoutLog = catchAsync(async (req, res) => {
  const log = await progressService.createWorkoutLog(req.user._id, req.body);
  res.status(HTTP.CREATED).json(new ApiResponse(HTTP.CREATED, log, 'Workout progress logged.'));
});

const createBodyMeasurement = catchAsync(async (req, res) => {
  const measurement = await progressService.createBodyMeasurement(req.user._id, req.body);
  res.status(HTTP.CREATED).json(new ApiResponse(HTTP.CREATED, measurement, 'Body measurement saved.'));
});

const getWorkoutProgress = catchAsync(async (req, res) => {
  const result = await progressService.getWorkoutProgress(req.user._id, req.query);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, result.items, 'Workout progress retrieved.', result.meta));
});

const getBodyMeasurements = catchAsync(async (req, res) => {
  const result = await progressService.getBodyMeasurements(req.user._id, req.query);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, result.items, 'Body measurements retrieved.', result.meta));
});

const getStats = catchAsync(async (req, res) => {
  const stats = await progressService.getProgressStats(req.user._id, req.query.exerciseId);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, stats));
});

const deleteWorkoutLog = catchAsync(async (req, res) => {
  await progressService.deleteWorkoutLog(req.params.id, req.user._id);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, null, 'Workout log deleted.'));
});

module.exports = {
  createWorkoutLog,
  createBodyMeasurement,
  getWorkoutProgress,
  getBodyMeasurements,
  getStats,
  deleteWorkoutLog,
};
