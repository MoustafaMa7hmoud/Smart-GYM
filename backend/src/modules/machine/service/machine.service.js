const Machine            = require('../model/machine.model');
const ApiFeatures        = require('../../../utils/apiFeatures');
const cloudinaryService  = require('../../../integrations/cloudinary.service');
const ApiError           = require('../../../utils/ApiError');
const logger             = require('../../../utils/logger');

const createMachine = async (data, file) => {
  if (file) data.image = file.path;
  const machine = await Machine.create(data);
  logger.info(`Machine created: ${machine.name} (${machine._id})`);
  return machine;
};

const getAllMachines = async (queryString) => {
  const features = new ApiFeatures(
    Machine.find({ isActive: true }),
    queryString
  )
    .filter()
    .search(['name', 'description'])
    .sort()
    .limitFields()
    .paginate();

  const [machines, total] = await Promise.all([
    features.query,
    features.count(),
  ]);

  return { total, ...features.meta, machines };
};

const getMachineById = async (id) => {
  const machine = await Machine.findById(id);
  if (!machine || !machine.isActive) throw new ApiError(404, 'Machine not found.');
  return machine;
};

const updateMachine = async (id, data, file) => {
  const machine = await Machine.findById(id);
  if (!machine) throw new ApiError(404, 'Machine not found.');

  if (file) {
    const oldPublicId = cloudinaryService.extractPublicId(machine.image);
    await cloudinaryService.deleteAsset(oldPublicId, 'image');
    data.image = file.path;
  }

  const updated = await Machine.findByIdAndUpdate(id, data, {
    new: true, runValidators: true,
  });
  logger.info(`Machine updated: ${updated.name} (${id})`);
  return updated;
};

const deleteMachine = async (id) => {
  const machine = await Machine.findByIdAndDelete(id);
  if (!machine) throw new ApiError(404, 'Machine not found.');
  if (machine.image) {
    const publicId = cloudinaryService.extractPublicId(machine.image);
    await cloudinaryService.deleteAsset(publicId, 'image');
  }
  logger.info(`Machine deleted: ${machine.name} (${id})`);
};

module.exports = { createMachine, getAllMachines, getMachineById, updateMachine, deleteMachine };
