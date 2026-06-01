const workoutPlanService = require('../service/workoutPlan.service');
const catchAsync         = require('../../../utils/catchAsync');
const ApiResponse        = require('../../../utils/ApiResponse');
const { HTTP }           = require('../../../utils/constants');

const generatePlan = catchAsync(async (req, res) => {
  const plan = await workoutPlanService.generatePlan(req.user._id, req.body);
  res.status(HTTP.CREATED).json(new ApiResponse(HTTP.CREATED, plan, 'Workout plan generated.'));
});

const getMyPlans = catchAsync(async (req, res) => {
  const result = await workoutPlanService.getUserPlans(req.user._id, req.query);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, result.items, 'Workout plans retrieved.', result.meta));
});

const getPlanById = catchAsync(async (req, res) => {
  const plan = await workoutPlanService.getPlanById(req.params.id, req.user._id);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, plan));
});

const updatePlan = catchAsync(async (req, res) => {
  const plan = await workoutPlanService.updatePlan(req.params.id, req.user._id, req.body);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, plan, 'Workout plan updated.'));
});

const deletePlan = catchAsync(async (req, res) => {
  await workoutPlanService.deletePlan(req.params.id, req.user._id);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, null, 'Workout plan deleted.'));
});

module.exports = { generatePlan, getMyPlans, getPlanById, updatePlan, deletePlan };
