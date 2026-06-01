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

const getById = catchAsync(async (req, res) => {
  const paymentId = req.params.id;
  const payment = await paymentService.getById(paymentId);
  // Only owner or admin can view full payment
  if (!payment) return res.status(HTTP.NOT_FOUND).json(new ApiResponse(HTTP.NOT_FOUND, null, 'Payment not found.'));
  // payment.user may be populated (object) or a raw ObjectId — handle both
  const paymentUserId = payment.user?._id ?? payment.user;
  const isOwner = req.user && String(paymentUserId) === String(req.user._id);
  const isAdmin = req.user && req.user.role === 'admin';
  if (!isOwner && !isAdmin) return res.status(HTTP.FORBIDDEN).json(new ApiResponse(HTTP.FORBIDDEN, null, 'Not allowed to view this payment.'));

  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, payment, 'Payment retrieved.'));
});

/**
 * Paymob webhook handler — supports both GET (query params) and POST (body).
 * Paymob can send either:
 *   GET  /api/v1/payments/webhook?id=...&success=true&hmac=<value>&...
 *   POST /api/v1/payments/webhook with JSON body
 * We always respond 200 so Paymob doesn't keep retrying.
 */
const webhook = async (req, res) => {
  const hmac = req.query.hmac || req.body?.hmac;
  const payload = req.method === 'GET' ? req.query : req.body;

  logger.info(`Paymob webhook received (${req.method}) — HMAC: ${hmac ? 'present' : 'MISSING'}`);

  try {
    await paymentService.handleWebhook(payload, hmac, req.method);
  } catch (error) {
    logger.warn('Paymob webhook processing error', {
      message: error.message || error,
      query: req.query,
      bodyType: Buffer.isBuffer(req.body) ? 'Buffer' : typeof req.body,
    });
  }

  // Always ACK Paymob so it does not keep retrying the webhook call.
  res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, { received: true }));
};

module.exports = { initiatePayment, getMyPayments, getAllPayments, getById, webhook };