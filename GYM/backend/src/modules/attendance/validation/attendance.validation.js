const Joi = require('joi');

const checkInSchema  = Joi.object({ notes: Joi.string().max(200).allow('') });
const checkOutSchema = Joi.object({ notes: Joi.string().max(200).allow('') });
const qrCheckInSchema = Joi.object({
  qrToken: Joi.string().required(),
  notes:   Joi.string().max(200).allow(''),
});

module.exports = { checkInSchema, checkOutSchema, qrCheckInSchema };
