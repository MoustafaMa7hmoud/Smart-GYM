const trainerService = require('../service/trainer.service');
const catchAsync     = require('../../../utils/catchAsync');
const ApiResponse    = require('../../../utils/ApiResponse');
const { HTTP }       = require('../../../utils/constants');

const createTrainer = catchAsync(async (req, res) => {
  const userId  = req.params.userId || req.user._id;
  const trainer = await trainerService.createTrainerProfile(userId, req.body);
  res.status(HTTP.CREATED).json(new ApiResponse(HTTP.CREATED, trainer, 'Trainer profile created.'));
});

const getAllTrainers = catchAsync(async (req, res) => {
  const result = await trainerService.getAllTrainers(req.query);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, result));
});

const getTrainerById = catchAsync(async (req, res) => {
  const trainer = await trainerService.getTrainerById(req.params.id);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, trainer));
});

const updateTrainer = catchAsync(async (req, res) => {
  const trainer = await trainerService.updateTrainer(req.params.id, req.body);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, trainer, 'Trainer updated.'));
});

const assignUser = catchAsync(async (req, res) => {
  const trainer = await trainerService.assignUserToTrainer(req.params.id, req.params.userId);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, trainer, 'User assigned to trainer.'));
});

const unassignUser = catchAsync(async (req, res) => {
  const trainer = await trainerService.unassignUserFromTrainer(req.params.id, req.params.userId);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, trainer, 'User unassigned from trainer.'));
});

const deleteTrainer = catchAsync(async (req, res) => {
  await trainerService.deleteTrainer(req.params.id);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, null, 'Trainer deleted.'));
});

module.exports = {
  createTrainer, getAllTrainers, getTrainerById,
  updateTrainer, assignUser, unassignUser, deleteTrainer,
};
