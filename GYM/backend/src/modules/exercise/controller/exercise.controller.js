const exerciseService = require('../service/exercise.service');
const catchAsync      = require('../../../utils/catchAsync');
const ApiResponse     = require('../../../utils/ApiResponse');
const { HTTP }        = require('../../../utils/constants');

const createExercise = catchAsync(async (req, res) => {
  const data = { ...req.body };
  if (typeof data.tips     === 'string') data.tips     = JSON.parse(data.tips);
  if (typeof data.mistakes === 'string') data.mistakes = JSON.parse(data.mistakes);
  const exercise = await exerciseService.createExercise(data, req.files);
  res.status(HTTP.CREATED).json(new ApiResponse(HTTP.CREATED, exercise, 'Exercise created.'));
});

const getAllExercises = catchAsync(async (req, res) => {
  const result = await exerciseService.getAllExercises(req.query);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, result));
});

const getExerciseById = catchAsync(async (req, res) => {
  const exercise = await exerciseService.getExerciseById(req.params.id);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, exercise));
});

const updateExercise = catchAsync(async (req, res) => {
  const data = { ...req.body };
  if (typeof data.tips     === 'string') data.tips     = JSON.parse(data.tips);
  if (typeof data.mistakes === 'string') data.mistakes = JSON.parse(data.mistakes);
  const exercise = await exerciseService.updateExercise(req.params.id, data, req.files);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, exercise, 'Exercise updated.'));
});

const deleteExercise = catchAsync(async (req, res) => {
  await exerciseService.deleteExercise(req.params.id);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, null, 'Exercise deleted.'));
});

module.exports = { createExercise, getAllExercises, getExerciseById, updateExercise, deleteExercise };
