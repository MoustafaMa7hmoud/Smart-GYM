const Payment      = require('../model/payment.model');
const { Subscription } = require('../../subscription/model/subscription.model');
const subscriptionService = require('../../subscription/service/subscription.service');
const paymob       = require('../../../integrations/paymob');
const ApiFeatures  = require('../../../utils/apiFeatures');
const { PAYMENT_STATUSES, SUBSCRIPTION_STATUSES } = require('../../../utils/constants');
const ApiError     = require('../../../utils/ApiError');
// Support multiple project structures (standalone folder vs full monorepo)
let User;
try {
  User = require('../../user/model/user.model');
} catch (_e1) {
  try {
    User = require('../../../modules/user/model/user.model');
  } catch (_e2) {
    User = null; // Will throw a clear error at runtime if initiatePayment is called
  }
}
const logger       = require('../../../utils/logger');

/**
 * Full Paymob 3-step payment initiation.
 * Step 1: Auth token → Step 2: Create order → Step 3: Payment key → iframe URL
 */
const initiatePayment = async (userId, subscriptionId) => {
  if (!User) throw new ApiError(500, 'User model not found. Check project structure.');
  const [user, sub] = await Promise.all([
    User.findById(userId),
    Subscription.findOne({ _id: subscriptionId, user: userId }),
  ]);

  if (!user) throw new ApiError(404, 'User not found.');
  if (!sub)  throw new ApiError(404, 'Subscription not found.');
  if (sub.status === SUBSCRIPTION_STATUSES.ACTIVE)
    throw new ApiError(400, 'Subscription is already active.');

  const amountCents = sub.price * 100; // EGP → cents

  logger.info(`Initiating Paymob payment for user ${userId}, subscription ${subscriptionId}`);

  // ── Step 1: Auth token ────────────────────────────────────────────────
  const authToken = await paymob.getAuthToken();

  // ── Step 2: Create order ──────────────────────────────────────────────
  const order = await paymob.createOrder(authToken, amountCents, sub.currency, [
    {
      name:         `${sub.plan} Gym Subscription`,
      amount_cents: amountCents,
      description:  Array.isArray(sub.features) ? sub.features.join(', ') : (sub.features || ''),
      quantity:     1,
    },
  ]);

  // ── Step 3: Payment key ───────────────────────────────────────────────
  const billingData = {
    apartment:       'NA',
    email:           user.email || 'NA',
    floor:           'NA',
    first_name:      ((user.fullName || user.name || user.email || 'NA') + '').split(' ')[0] || 'NA',
    last_name:       (((user.fullName || user.name || user.email || 'NA') + '').split(' ').slice(1).join(' ') || 'NA'),
    street:          'NA',
    building:        'NA',
    phone_number:    user.phone || '+201000000000',
    shipping_method: 'NA',
    postal_code:     'NA',
    city:            'NA',
    country:         'EG',
    state:           'NA',
  };

  const paymentKey = await paymob.getPaymentKey(
    authToken, order.id, amountCents, billingData
  );
  const iframeUrl = paymob.buildIframeUrl(paymentKey);

  // ── Persist pending payment record ────────────────────────────────────
  const payment = await Payment.create({
    user:          userId,
    subscription:  subscriptionId,
    paymobOrderId: String(order.id),
    amount:        amountCents,
    amountEGP:     sub.price,
    currency:      sub.currency,
    status:        PAYMENT_STATUSES.PENDING,
    method:        'card',
    gateway:       { name: 'paymob', chargeId: String(order.id) },
    iframeUrl,
  });

  logger.info(`Payment record created: ${payment._id}, Paymob order: ${order.id}`);

  return {
    iframeUrl,
    paymentId:    payment._id,
    paymobOrderId: order.id,
    amountEGP:    sub.price,
  };
};

/**
 * Webhook handler — called by Paymob after the user completes (or fails) payment.
 * Verifies HMAC signature, then updates Payment + Subscription accordingly.
 *
 * Paymob can send:
 *   GET  /api/v1/payments/webhook?id=...&success=true&hmac=<value>&...
 *   POST /api/v1/payments/webhook with JSON body
 *
 * @param {object|Buffer} payload  Query params (GET) or body (POST)
 * @param {string} hmac            HMAC query parameter for verification
 * @param {string} method          HTTP method (GET or POST)
 */
const parseBoolean = (value) => {
  if (value === true || value === 'true' || value === '1' || value === 1 || value === 'yes') return true;
  if (value === false || value === 'false' || value === '0' || value === 0 || value === 'no') return false;
  return undefined;
};

const getOrderIdFromPayload = (transactionObj) => {
  const orderId = transactionObj.order?.id ?? transactionObj.order ?? transactionObj.order_id ?? transactionObj.orderId;
  return orderId !== undefined && orderId !== null ? String(orderId) : '';
};

const handleWebhook = async (payload, hmac, method = 'POST') => {
  // Payload may arrive as Buffer (raw) or already-parsed object
  let transactionObj;
  try {
    let rawObj;
    if (Buffer.isBuffer(payload)) {
      rawObj = JSON.parse(payload.toString());
    } else if (typeof payload === 'string') {
      rawObj = JSON.parse(payload);
    } else {
      // For GET requests, query params come as object (already flat)
      rawObj = payload;
    }

    // ── Unwrap Paymob POST body ────────────────────────────────────────────
    // Paymob wraps the transaction object inside { obj: { ... } } for POST
    // callbacks, but sends flat query params for GET (Transaction Response URL).
    // DOC_DOS reference: `const data = req.body.obj || req.body;`
    transactionObj = rawObj?.obj ?? rawObj;
  } catch {
    throw new ApiError(400, 'Webhook: invalid payload format.');
  }

  // ── HMAC verification ─────────────────────────────────────────────────
  const isValid = paymob.verifyHmac(transactionObj, hmac);
  if (!isValid) {
    logger.warn('Paymob webhook: invalid HMAC signature');
    throw new ApiError(400, 'Invalid HMAC signature.');
  }

  const paymobOrderId = getOrderIdFromPayload(transactionObj);
  if (!paymobOrderId) {
    logger.warn('Paymob webhook: missing order ID in payload', { payload: transactionObj });
    return; // silently ignore malformed payload
  }

  logger.info(`Processing Paymob webhook for order: ${paymobOrderId}`);

  const payment = await Payment.findOne({ paymobOrderId });
  if (!payment) {
    logger.warn(`Paymob webhook: no payment found for order ${paymobOrderId}`);
    return; // unknown order — may be a duplicate callback
  }

  // Idempotency guard — don't re-process already-settled payments
  if ([PAYMENT_STATUSES.COMPLETED, PAYMENT_STATUSES.REFUNDED].includes(payment.status)) {
    logger.info(`Paymob webhook: payment ${payment._id} already settled — skipping`);
    return;
  }

  // ── Update payment record ─────────────────────────────────────────────
  payment.webhookPayload      = transactionObj;
  payment.paymobTransactionId = String(transactionObj.id || '');

  const isSuccess = parseBoolean(transactionObj.success);
  const isPending = parseBoolean(transactionObj.pending);

  if (isSuccess === true && isPending !== true) {
    payment.status = PAYMENT_STATUSES.COMPLETED;
    payment.paidAt = new Date();
    await payment.save();

    // Activate the linked subscription
    if (payment.subscription) {
      await subscriptionService.activateSubscription(payment.subscription, payment._id);
    }
    logger.info(`Payment success: ${payment._id} | Order: ${paymobOrderId}`);

  } else if (isSuccess === false && isPending !== true) {
    payment.status = PAYMENT_STATUSES.FAILED;
    await payment.save();
    logger.warn(`Payment failed: ${payment._id} | Order: ${paymobOrderId}`);

  } else {
    // Pending — record webhook data even if status remains pending
    await payment.save();
    logger.info(`Payment pending: ${payment._id} | Order: ${paymobOrderId}`);
  }
};

const getMyPayments = async (userId, queryString) => {
  const features = new ApiFeatures(
    Payment.find({ user: userId }).populate('subscription', 'plan price currency'),
    queryString
  ).filter().sort().paginate();

  const [items] = await Promise.all([features.query, features.count()]);
  return { items, meta: features.meta };
};

const getAllPayments = async (queryString) => {
  const features = new ApiFeatures(
    Payment.find()
      .populate('user', 'name email')
      .populate('subscription', 'plan price'),
    queryString
  ).filter().sort().paginate();

  const [items] = await Promise.all([features.query, features.count()]);
  return { items, meta: features.meta };
};

const getById = async (paymentId) => {
  const payment = await Payment.findById(paymentId)
    .populate('subscription', 'plan price currency status')
    .populate('user', 'name email');
  return payment;
};

module.exports = { initiatePayment, handleWebhook, getMyPayments, getAllPayments, getById };