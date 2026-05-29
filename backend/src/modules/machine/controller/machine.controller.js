const machineService = require('../service/machine.service');
const catchAsync     = require('../../../utils/catchAsync');
const ApiResponse    = require('../../../utils/ApiResponse');
const { HTTP }       = require('../../../utils/constants');

const createMachine = catchAsync(async (req, res) => {
  const data = { ...req.body };
  if (typeof data.targetMuscles === 'string') data.targetMuscles = JSON.parse(data.targetMuscles);
  const machine = await machineService.createMachine(data, req.file);
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
  const data = { ...req.body };
  if (typeof data.targetMuscles === 'string') data.targetMuscles = JSON.parse(data.targetMuscles);
  const machine = await machineService.updateMachine(req.params.id, data, req.file);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, machine, 'Machine updated.'));
});

const deleteMachine = catchAsync(async (req, res) => {
  await machineService.deleteMachine(req.params.id);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, null, 'Machine deleted.'));
});

module.exports = { createMachine, getAllMachines, getMachineById, updateMachine, deleteMachine };
