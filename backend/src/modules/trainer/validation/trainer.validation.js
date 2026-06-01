const Joi = require('joi');

const createTrainerSchema = Joi.object({
  bio:             Joi.string().min(20).max(1000).allow(''),
  specializations: Joi.array().items(Joi.string().trim()).min(1).max(10),
  certificates:    Joi.array().items(
    Joi.object({
      name:     Joi.string().required(),
      issuedBy: Joi.string().required(),
      issuedAt: Joi.string().isoDate().required(),
      imageUrl: Joi.string().uri().allow('', null).optional(),
    })
  ).max(20).optional(),
  experience:   Joi.number().min(0).max(50),
  isAvailable:  Joi.boolean(),
  isApproved:   Joi.boolean(),
  sessionPrice: Joi.number().min(0),
  currency:     Joi.string().valid('EGP', 'USD').optional(),
  availability: Joi.array().items(
    Joi.object({
      day: Joi.string().valid(
        'sunday','monday','tuesday','wednesday','thursday','friday','saturday'
      ).required(),
      slots: Joi.array().items(
        Joi.object({
          startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
          endTime:   Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
          isBooked:  Joi.boolean().optional(),
        })
      ).optional(),
    })
  ).optional(),
});

const updateTrainerSchema = createTrainerSchema;

// ── Canonical specialization values ──────────────────────────────────────────
const VALID_SPECIALIZATIONS = [
  'weightLoss', 'bodyBuilding', 'cardio', 'yoga', 'crossfit', 'pilates',
  'nutrition', 'rehabilitation', 'kickboxing', 'stretching',
  // Extended values
  'endurance', 'generalFitness', 'bodyRecomposition', 'strengthTraining',
];

// Alias map: lower-cased / normalized key → canonical value
const SPECIALIZATION_ALIASES = {
  // Weight loss variants
  'weight loss':  'weightLoss',
  'weightloss':   'weightLoss',
  'weight_loss':  'weightLoss',

  // Body building variants
  'body building':   'bodyBuilding',
  'bodybuilding':    'bodyBuilding',
  'body_building':   'bodyBuilding',
  'strength training': 'strengthTraining',
  'strength':          'strengthTraining',
  'strength_training': 'strengthTraining',

  // Body recomposition
  'body recomposition':  'bodyRecomposition',
  'bodyrecomposition':   'bodyRecomposition',
  'body_recomposition':  'bodyRecomposition',
  'recomposition':       'bodyRecomposition',

  // General fitness
  'general fitness':  'generalFitness',
  'generalfitness':   'generalFitness',
  'general_fitness':  'generalFitness',
  'fitness':          'generalFitness',

  // Endurance
  'endurance': 'endurance',

  // Direct matches (passthrough)
  'nutrition':      'nutrition',
  'cardio':         'cardio',
  'yoga':           'yoga',
  'crossfit':       'crossfit',
  'pilates':        'pilates',
  'rehab':          'rehabilitation',
  'rehabilitation': 'rehabilitation',
  'kickboxing':     'kickboxing',
  'stretching':     'stretching',
};

function toCanonicalSpecialization(value) {
  if (!value || typeof value !== 'string') return null;

  // Normalize: lowercase, collapse separators to spaces
  const key = value.toLowerCase().replace(/[-_]+/g, ' ').trim();

  // Exact alias match
  if (SPECIALIZATION_ALIASES[key]) return SPECIALIZATION_ALIASES[key];

  // Direct match against valid list (case-insensitive, ignoring spaces)
  const keyNoSpace = key.replace(/\s+/g, '');
  for (const v of VALID_SPECIALIZATIONS) {
    if (v.toLowerCase() === keyNoSpace) return v;
  }

  // camelCase reconstruction: "body building" → "bodyBuilding"
  const words = key.split(/\s+/);
  const camel = words.map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1))).join('');
  for (const v of VALID_SPECIALIZATIONS) {
    if (v.toLowerCase() === camel.toLowerCase() || v === camel) return v;
  }

  return null;
}

/**
 * Normalize an array of specialization strings into canonical DB values.
 * Returns { normalized: string[], invalid: string[] }
 */
function normalizeSpecializations(arr) {
  if (!Array.isArray(arr)) return { normalized: [], invalid: [] };
  const normalized = [];
  const invalid    = [];
  for (const s of arr) {
    const canon = toCanonicalSpecialization(s);
    if (canon)                               normalized.push(canon);
    else if (typeof s === 'string' && s.trim().length) invalid.push(s);
  }
  return { normalized: [...new Set(normalized)].slice(0, 10), invalid };
}

module.exports = { createTrainerSchema, updateTrainerSchema, normalizeSpecializations };
