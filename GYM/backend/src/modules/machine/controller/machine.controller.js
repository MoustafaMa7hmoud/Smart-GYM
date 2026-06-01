const machineService = require('../service/machine.service');
const catchAsync     = require('../../../utils/catchAsync');
const ApiResponse    = require('../../../utils/ApiResponse');
const { HTTP }       = require('../../../utils/constants');

const normalizeMachineBody = (body) => {
  const data = { ...body };
  if (typeof data.targetMuscles === 'string') data.targetMuscles = JSON.parse(data.targetMuscles);
  if (typeof data.muscleGroups === 'string') data.muscleGroups = JSON.parse(data.muscleGroups);
  if (data.targetMuscles && !data.muscleGroups) data.muscleGroups = data.targetMuscles;
  if (data.description && !data.notes) data.notes = data.description;
  delete data.targetMuscles;
  delete data.description;
  return data;
};

const createMachine = catchAsync(async (req, res) => {
  const machine = await machineService.createMachine(normalizeMachineBody(req.body), req.file);
  res.status(HTTP.CREATED).json(new ApiResponse(HTTP.CREATED, machine, 'Machine created.'));
});

const getAllMachines = catchAsync(async (req, res) => {
  const result = await machineService.getAllMachines(req.query);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, result));
});

const getMachineById = catchAsync(async (req, res) => {
  const machine = await machineService.getMachineById(req.params.id);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, machine));
});

const updateMachine = catchAsync(async (req, res) => {
  const machine = await machineService.updateMachine(req.params.id, normalizeMachineBody(req.body), req.file);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, machine, 'Machine updated.'));
});

const deleteMachine = catchAsync(async (req, res) => {
  await machineService.deleteMachine(req.params.id);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, null, 'Machine deleted.'));
});

module.exports = { createMachine, getAllMachines, getMachineById, updateMachine, deleteMachine };
