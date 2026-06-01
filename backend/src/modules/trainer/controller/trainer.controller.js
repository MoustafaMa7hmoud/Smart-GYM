const trainerService = require('../service/trainer.service');
const { normalizeSpecializations } = require('../validation/trainer.validation');
const catchAsync  = require('../../../utils/catchAsync');
const ApiResponse = require('../../../utils/ApiResponse');
const ApiError    = require('../../../utils/ApiError');
const { HTTP }    = require('../../../utils/constants');

const createTrainer = catchAsync(async (req, res) => {
  const userId = req.params.userId || req.user._id;
  const data   = { ...req.body };

  if (data.specializations) {
    const { normalized, invalid } = normalizeSpecializations(data.specializations);
    if (invalid.length) throw new ApiError(400, `Invalid specialization: ${invalid.join(', ')}`);
    data.specializations = normalized;
  }

  if (data.sessionPrice === undefined || data.sessionPrice === null) data.sessionPrice = 0;

  const trainer = await trainerService.createTrainerProfile(userId, data);
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
  const data = { ...req.body };
  if (data.specializations) {
    const { normalized, invalid } = normalizeSpecializations(data.specializations);
    if (invalid.length) throw new ApiError(400, `Invalid specialization: ${invalid.join(', ')}`);
    data.specializations = normalized;
  }
  if (data.sessionPrice === undefined || data.sessionPrice === null) data.sessionPrice = 0;

  const trainer = await trainerService.updateTrainer(req.params.id, data);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, trainer, 'Trainer updated.'));
});

const approveTrainer = catchAsync(async (req, res) => {
  const trainer = await trainerService.approveTrainer(req.params.id);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, trainer, 'Trainer approved.'));
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
  updateTrainer, approveTrainer,
  assignUser, unassignUser, deleteTrainer,
};
