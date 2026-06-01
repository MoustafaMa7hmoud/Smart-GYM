const Machine            = require('../model/machine.model');
const ApiFeatures        = require('../../../utils/apiFeatures');
const cloudinaryService  = require('../../../integrations/cloudinary.service');
const ApiError           = require('../../../utils/ApiError');
const logger             = require('../../../utils/logger');

const applyUpload = (data, file) => {
  if (!file?.path) return data;
  const images = Array.isArray(data.images) ? [...data.images] : [];
  images.push(file.path);
  return { ...data, images };
};

const createMachine = async (data, file) => {
  const machine = await Machine.create(applyUpload(data, file));
  logger.info(`Machine created: ${machine.name} (${machine._id})`);
  return machine;
};

const getAllMachines = async (queryString) => {
  const features = new ApiFeatures(
    Machine.find({ status: { $ne: 'retired' } }),
    queryString
  )
    .filter()
    .search(['name', 'brand', 'notes'])
    .sort()
    .limitFields()
    .paginate();

  const [machines, total] = await Promise.all([
    features.query.exec(),
    features.count(),
  ]);

  return { total, ...features.meta, machines };
};

const getMachineById = async (id) => {
  const machine = await Machine.findById(id);
  if (!machine || machine.status === 'retired') throw new ApiError(404, 'Machine not found.');
  return machine;
};

const updateMachine = async (id, data, file) => {
  const machine = await Machine.findById(id);
  if (!machine) throw new ApiError(404, 'Machine not found.');

  let payload = { ...data };
  if (file?.path) {
    const oldUrl = machine.images?.[0];
    const oldPublicId = cloudinaryService.extractPublicId(oldUrl);
    if (oldPublicId) await cloudinaryService.deleteAsset(oldPublicId, 'image');
    payload = applyUpload(payload, file);
  }

  const updated = await Machine.findByIdAndUpdate(id, payload, {
    new: true, runValidators: true,
  });
  logger.info(`Machine updated: ${updated.name} (${id})`);
  return updated;
};

const deleteMachine = async (id) => {
  const machine = await Machine.findByIdAndDelete(id);
  if (!machine) throw new ApiError(404, 'Machine not found.');
  if (machine.images?.length) {
    for (const url of machine.images) {
      const publicId = cloudinaryService.extractPublicId(url);
      if (publicId) await cloudinaryService.deleteAsset(publicId, 'image');
    }
  }
  logger.info(`Machine deleted: ${machine.name} (${id})`);
};

module.exports = { createMachine, getAllMachines, getMachineById, updateMachine, deleteMachine };
