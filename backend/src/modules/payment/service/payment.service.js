const Payment      = require('../model/payment.model');
const { Subscription } = require('../../subscription/model/subscription.model');
const subscriptionService = require('../../subscription/service/subscription.service');
const paymob       = require('../../../integrations/paymob');
const ApiFeatures  = require('../../../utils/apiFeatures');
const { PAYMENT_STATUSES, SUBSCRIPTION_STATUSES } = require('../../../utils/constants');
const ApiError     = require('../../../utils/ApiError');
const User         = require('../../user/model/user.model');
const logger       = require('../../../utils/logger');

/**
 * Full Paymob 3-step payment initiation.
 * Step 1: Auth token → Step 2: Create order → Step 3: Payment key → iframe URL
 */
const initiatePayment = async (userId, subscriptionId) => {
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
      description:  sub.features.join(', '),
      quantity:     1,
    },
  ]);

  // ── Step 3: Payment key ───────────────────────────────────────────────
  const billingData = {
    apartment:       'NA',
    email:           user.email,
    floor:           'NA',
    first_name:      user.name.split(' ')[0] || user.name,
    last_name:       user.name.split(' ').slice(1).join(' ') || 'NA',
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
 * Paymob sends:  POST /api/v1/payments/webhook?hmac=<value>
 * Body is the transaction object (JSON).
 */
const handleWebhook = async (body, hmac) => {
  // Body may arrive as Buffer (raw) or already-parsed object
  let transactionObj;
  try {
    transactionObj = Buffer.isBuffer(body) ? JSON.parse(body.toString()) : body;
  } catch {
    throw new ApiError(400, 'Webhook: invalid JSON body.');
  }

  // ── HMAC verification ─────────────────────────────────────────────────
  const isValid = paymob.verifyHmac(transactionObj, hmac);
  if (!isValid) {
    logger.warn('Paymob webhook: invalid HMAC signature');
    throw new ApiError(400, 'Invalid HMAC signature.');
  }

  const paymobOrderId = String(
    transactionObj.order?.id ?? transactionObj.order ?? ''
  );

  if (!paymobOrderId) {
    logger.warn('Paymob webhook: missing order ID in payload');
    return; // silently ignore malformed payload
  }

  const payment = await Payment.findOne({ paymobOrderId });
  if (!payment) {
    logger.warn(`Paymob webhook: no payment found for order ${paymobOrderId}`);
    return; // unknown order — may be a duplicate callback
  }

  // Idempotency guard — don't re-process already-settled payments
  if ([PAYMENT_STATUSES.SUCCESS, PAYMENT_STATUSES.REFUNDED].includes(payment.status)) {
    logger.info(`Paymob webhook: payment ${payment._id} already settled — skipping`);
    return;
  }

  // ── Update payment record ─────────────────────────────────────────────
  payment.webhookPayload      = transactionObj;
  payment.paymobTransactionId = String(transactionObj.id || '');

  const isSuccess = transactionObj.success === true || transactionObj.success === 'true';
  const isPending = transactionObj.pending === true  || transactionObj.pending  === 'true';

  if (isSuccess && !isPending) {
    payment.status = PAYMENT_STATUSES.SUCCESS;
    payment.paidAt = new Date();
    await payment.save();

    // Activate the linked subscription
    if (payment.subscription) {
      await subscriptionService.activateSubscription(payment.subscription, payment._id);
    }
    logger.info(`Payment success: ${payment._id} | Order: ${paymobOrderId}`);

  } else if (!isSuccess && !isPending) {
    payment.status = PAYMENT_STATUSES.FAILED;
    await payment.save();
    logger.warn(`Payment failed: ${payment._id} | Order: ${paymobOrderId}`);

  } else {
    // Pending — no action needed yet
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

module.exports = { initiatePayment, handleWebhook, getMyPayments, getAllPayments };
