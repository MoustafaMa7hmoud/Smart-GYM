const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/paymob');
const ApiError = require('../utils/ApiError');

/**
 * Step 1 – Authenticate and get a short-lived auth token.
 */
const getAuthToken = async () => {
  const { data } = await axios.post(`${config.baseUrl}/auth/tokens`, {
    api_key: config.apiKey,
  });
  if (!data.token) throw new ApiError(502, 'Paymob: failed to obtain auth token.');
  return data.token;
};

/**
 * Step 2 – Register an order with Paymob.
 * @param {string} authToken
 * @param {number} amountCents  Amount in smallest currency unit (e.g. cents).
 * @param {string} currency
 * @param {object[]} items      Cart items array.
 */
const createOrder = async (authToken, amountCents, currency = 'EGP', items = []) => {
  const { data } = await axios.post(`${config.baseUrl}/ecommerce/orders`, {
    auth_token: authToken,
    delivery_needed: false,
    amount_cents: amountCents,
    currency,
    items,
  });
  if (!data.id) throw new ApiError(502, 'Paymob: failed to create order.');
  return data;
};

/**
 * Step 3 – Generate a payment key for the iframe.
 * @param {string} authToken
 * @param {number} orderId     Paymob order ID (integer).
 * @param {number} amountCents
 * @param {object} billingData
 */
const getPaymentKey = async (authToken, orderId, amountCents, billingData) => {
  const { data } = await axios.post(`${config.baseUrl}/acceptance/payment_keys`, {
    auth_token: authToken,
    amount_cents: amountCents,
    expiration: 3600,
    order_id: orderId,
    billing_data: billingData,
    currency: 'EGP',
    integration_id: Number(config.integrationId),
    lock_order_when_paid: true,
  });
  if (!data.token) throw new ApiError(502, 'Paymob: failed to generate payment key.');
  return data.token;
};

/**
 * Build the hosted iframe URL.
 */
const buildIframeUrl = (paymentKey) =>
  `${config.baseUrl}/acceptance/iframes/${config.iframeId}?payment_token=${paymentKey}`;

/**
 * Verify HMAC signature for incoming Paymob webhooks.
 * @param {object} transactionObj  The transaction object from Paymob callback.
 * @param {string} receivedHmac    The hmac query parameter sent by Paymob.
 */
const verifyHmac = (transactionObj, receivedHmac) => {
  const keys = [
    'amount_cents', 'created_at', 'currency', 'error_occured',
    'has_parent_transaction', 'id', 'integration_id', 'is_3d_secure',
    'is_auth', 'is_capture', 'is_refunded', 'is_standalone_payment',
    'is_voided', 'order', 'owner', 'pending',
    'source_data.pan', 'source_data.sub_type', 'source_data.type',
    'success',
  ];

  const concatenated = keys
    .map((key) => {
      const parts = key.split('.');
      return parts.reduce((obj, k) => (obj ? obj[k] : ''), transactionObj) ?? '';
    })
    .join('');

  const computed = crypto
    .createHmac('sha512', config.hmacSecret)
    .update(concatenated)
    .digest('hex');

  return computed === receivedHmac;
};

module.exports = { getAuthToken, createOrder, getPaymentKey, buildIframeUrl, verifyHmac };
