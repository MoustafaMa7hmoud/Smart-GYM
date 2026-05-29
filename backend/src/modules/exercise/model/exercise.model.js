const mongoose = require('mongoose');
const { LEVELS, EXERCISE_CATEGORIES } = require('../../../utils/constants');

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exercise name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    muscle: {
      type: String,
      required: [true, 'Target muscle group is required'],
      trim: true,
      maxlength: [50, 'Muscle name cannot exceed 50 characters'],
    },
    machine: { type: mongoose.Schema.Types.ObjectId, ref: 'Machine', default: null },
    video: { type: String, default: null },
    videoPublicId: { type: String, default: null, select: false },
    image: { type: String, default: null },
    imagePublicId: { type: String, default: null, select: false },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    tips: {
      type: [{ type: String, trim: true }],
      default: [],
      validate: { validator: (a) => a.length <= 20, message: 'Max 20 tips allowed' },
    },
    mistakes: {
      type: [{ type: String, trim: true }],
      default: [],
      validate: { validator: (a) => a.length <= 20, message: 'Max 20 mistakes allowed' },
    },
    level: {
      type: String,
      enum: { values: Object.values(LEVELS), message: 'Invalid level: {VALUE}' },
      required: [true, 'Difficulty level is required'],
    },
    category: {
      type: String,
      enum: { values: Object.values(EXERCISE_CATEGORIES), message: 'Invalid category: {VALUE}' },
      default: EXERCISE_CATEGORIES.STRENGTH,
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

exerciseSchema.index({ muscle: 1, level: 1 });
exerciseSchema.index({ category: 1, isActive: 1 });
exerciseSchema.index({ name: 'text', description: 'text', muscle: 'text' });

module.exports = mongoose.model('Exercise', exerciseSchema);
