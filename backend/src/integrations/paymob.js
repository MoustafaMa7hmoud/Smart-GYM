const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/paymob');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

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
 * Convert flat query parameters to nested object structure.
 * E.g., { 'source_data.pan': '4242', 'source_data.type': 'card' }
 *    => { source_data: { pan: '4242', type: 'card' } }
 */
const flattenToNested = (flatObj) => {
  const result = {};
  for (const [key, value] of Object.entries(flatObj)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
};

/**
 * Verify HMAC signature for incoming Paymob webhooks.
 * @param {object} transactionObj  The transaction object from Paymob callback.
 * @param {string} receivedHmac    The hmac query parameter sent by Paymob.
 */
const verifyHmac = (transactionObj, receivedHmac) => {
  // If flat query params use dotted keys, convert to nested structure
  const isFlat = Object.keys(transactionObj).some((key) => key.includes('.'));
  const obj = isFlat ? flattenToNested(transactionObj) : transactionObj;

  logger.debug(`HMAC verification: isFlat=${isFlat}`, {
    receivedHmac: receivedHmac ? `${receivedHmac.substring(0, 16)}...` : 'MISSING',
    objKeys: Object.keys(obj),
  });

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
      const value = parts.reduce((o, k) => (o ? o[k] : ''), obj) ?? '';
      logger.debug(`HMAC key '${key}' => '${value}'`);
      return value;
    })
    .join('');

  logger.debug(`HMAC concatenated (first 100 chars): ${concatenated.substring(0, 100)}...`);

  const computed = crypto
    .createHmac('sha512', config.hmacSecret)
    .update(concatenated)
    .digest('hex');

  logger.debug(`Computed HMAC: ${computed.substring(0, 16)}...`);
  logger.debug(`Received HMAC: ${receivedHmac ? receivedHmac.substring(0, 16) + '...' : 'MISSING'}`);

  const isValid = computed === receivedHmac;
  logger.info(`HMAC verification result: ${isValid ? 'VALID ✓' : 'INVALID ✗'}`);

  return isValid;
};

module.exports = { getAuthToken, createOrder, getPaymentKey, buildIframeUrl, verifyHmac };
