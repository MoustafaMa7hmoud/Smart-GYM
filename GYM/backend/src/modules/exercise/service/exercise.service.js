const Exercise           = require('../model/exercise.model');
const ApiFeatures        = require('../../../utils/apiFeatures');
const cloudinaryService  = require('../../../integrations/cloudinary.service');
const { CLOUDINARY_FOLDERS } = require('../../../utils/constants');
const ApiError           = require('../../../utils/ApiError');
const logger             = require('../../../utils/logger');

const createExercise = async (data, files) => {
  if (files?.video?.[0]) {
    data.video        = files.video[0].path;
    data.videoPublicId = files.video[0].filename;
  }
  if (files?.image?.[0]) {
    data.image        = files.image[0].path;
    data.imagePublicId = files.image[0].filename;
  }
  const exercise = await Exercise.create(data);
  logger.info(`Exercise created: ${exercise.name} (${exercise._id})`);
  return exercise;
};

const getAllExercises = async (queryString) => {
  const features = new ApiFeatures(
    Exercise.find({ isActive: true }).populate('machine', 'name targetMuscles'),
    queryString
  )
    .filter()
    .search(['name', 'description', 'muscle'])
    .sort()
    .limitFields()
    .paginate();

  const [exercises, total] = await Promise.all([
    features.query,
    features.count(),
  ]);

  return { total, ...features.meta, exercises };
};

const getExerciseById = async (id) => {
  const exercise = await Exercise.findById(id).populate('machine');
  if (!exercise || !exercise.isActive) throw new ApiError(404, 'Exercise not found.');
  return exercise;
};

const updateExercise = async (id, data, files) => {
  const exercise = await Exercise.findById(id);
  if (!exercise) throw new ApiError(404, 'Exercise not found.');

  if (files?.video?.[0]) {
    await cloudinaryService.deleteAsset(exercise.videoPublicId, 'video');
    data.video        = files.video[0].path;
    data.videoPublicId = files.video[0].filename;
  }
  if (files?.image?.[0]) {
    await cloudinaryService.deleteAsset(exercise.imagePublicId, 'image');
    data.image        = files.image[0].path;
    data.imagePublicId = files.image[0].filename;
  }

  const updated = await Exercise.findByIdAndUpdate(id, data, {
    new: true, runValidators: true,
  }).populate('machine');

  logger.info(`Exercise updated: ${updated.name} (${id})`);
  return updated;
};

const deleteExercise = async (id) => {
  const exercise = await Exercise.findById(id);
  if (!exercise) throw new ApiError(404, 'Exercise not found.');

  await Promise.all([
    cloudinaryService.deleteAsset(exercise.videoPublicId, 'video'),
    cloudinaryService.deleteAsset(exercise.imagePublicId, 'image'),
  ]);

  await exercise.deleteOne();
  logger.info(`Exercise deleted: ${exercise.name} (${id})`);
};

module.exports = {
  createExercise,
  getAllExercises,
  getExerciseById,
  updateExercise,
  deleteExercise,
};
