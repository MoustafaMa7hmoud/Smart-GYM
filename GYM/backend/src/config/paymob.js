const requiredVars = [
  'PAYMOB_API_KEY',
  'PAYMOB_INTEGRATION_ID',
  'PAYMOB_IFRAME_ID',
  'PAYMOB_HMAC_SECRET',
];

const missingVars = requiredVars.filter((name) => !process.env[name]);
if (missingVars.length) {
  throw new Error(`Missing Paymob environment variables: ${missingVars.join(', ')}`);
}

module.exports = {
  apiKey:        process.env.PAYMOB_API_KEY,
  integrationId: Number(process.env.PAYMOB_INTEGRATION_ID),
  iframeId:      process.env.PAYMOB_IFRAME_ID,
  hmacSecret:    process.env.PAYMOB_HMAC_SECRET,
  baseUrl:       (process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com/api').replace(/\/+$/, ''),
};
