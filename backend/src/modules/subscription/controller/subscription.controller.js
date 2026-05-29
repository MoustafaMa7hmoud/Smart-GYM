const subscriptionService = require('../service/subscription.service');
const catchAsync          = require('../../../utils/catchAsync');
const ApiResponse         = require('../../../utils/ApiResponse');
const { HTTP }            = require('../../../utils/constants');

const createSubscription = catchAsync(async (req, res) => {
  const sub = await subscriptionService.createSubscription(req.user._id, req.body);
  res.status(HTTP.CREATED).json(new ApiResponse(HTTP.CREATED, sub, 'Subscription created. Proceed to payment.'));
});

const getMySubscription = catchAsync(async (req, res) => {
  const sub = await subscriptionService.getMySubscription(req.user._id);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, sub));
});

const cancelSubscription = catchAsync(async (req, res) => {
  const sub = await subscriptionService.cancelSubscription(req.params.id, req.user._id);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, sub, 'Subscription cancelled.'));
});

const getAllSubscriptions = catchAsync(async (req, res) => {
  const result = await subscriptionService.getAllSubscriptions(req.query);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, result.items, 'Subscriptions retrieved.', result.meta));
});

const getPlanCatalogue = catchAsync(async (req, res) => {
  const catalogue = subscriptionService.getPlanCatalogue();
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, catalogue));
});

module.exports = {
  createSubscription, getMySubscription,
  cancelSubscription, getAllSubscriptions, getPlanCatalogue,
};
