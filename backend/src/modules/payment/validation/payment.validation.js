const Joi = require('joi');

const initiatePaymentSchema = Joi.object({
  subscriptionId: Joi.string().hex().length(24).required(),
});

module.exports = { initiatePaymentSchema };
