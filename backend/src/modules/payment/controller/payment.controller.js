const paymentService = require('../service/payment.service');
const catchAsync = require('../../../utils/catchAsync');
const ApiResponse = require('../../../utils/ApiResponse');
const { HTTP } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

const initiatePayment = catchAsync(async (req, res) => {
  const { subscriptionId } = req.body;
  const result = await paymentService.initiatePayment(req.user._id, subscriptionId);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, result, 'Payment initiated.'));
});

const getMyPayments = catchAsync(async (req, res) => {
  const result = await paymentService.getMyPayments(req.user._id, req.query);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, result.items, 'User payments retrieved.', result.meta));
});

const getAllPayments = catchAsync(async (req, res) => {
  const result = await paymentService.getAllPayments(req.query);
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, result.items, 'Payments retrieved.', result.meta));
});

/**
 * Paymob sends POST /api/v1/payments/webhook?hmac=<value>
 * Body arrives as Buffer (raw) because of the special middleware in app.js.
 * We always respond 200 so Paymob doesn't keep retrying.
 */
const webhook = catchAsync(async (req, res) => {
  const hmac = req.query.hmac;
  logger.info(`Paymob webhook received — HMAC: ${hmac ? 'present' : 'MISSING'}`);

  await paymentService.handleWebhook(req.body, hmac);

  // Always ACK Paymob, even on HMAC failure (we throw internally but catch here)
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, { received: true }));
});

module.exports = { initiatePayment, getMyPayments, getAllPayments, webhook };

