const mongoose = require('mongoose');
const { SUBSCRIPTION_PLANS } = require('../../../utils/constants');

const userSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    plan: {
      type: String,
      enum: Object.values(SUBSCRIPTION_PLANS),
      required: [true, 'Subscription plan is required'],
    },
    durationMonths: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 month'],
      max: [12, 'Duration cannot exceed 12 months'],
      default: 1,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      validate: {
        validator: function (v) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return v >= today;
        },
        message: 'Start date cannot be in the past',
      },
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (v) {
          return v > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: { type: String, default: 'EGP', enum: ['EGP', 'USD'] },
    features: { type: [String], default: [] },
    status: {
      type: String,
      enum: {
        values: ['active', 'expired', 'cancelled', 'frozen', 'pending'],
        message: 'Invalid subscription status: {VALUE}',
      },
      default: 'pending',
    },
    notes: { type: String, maxlength: [500, 'Notes too long'], trim: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSubscriptionSchema.virtual('daysRemaining').get(function () {
  if (this.status !== 'active') return 0;
  const diff = this.endDate - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

userSubscriptionSchema.virtual('isExpired').get(function () {
  return this.endDate < new Date();
});

userSubscriptionSchema.index({ user: 1, status: 1 });
userSubscriptionSchema.index({ endDate: 1, status: 1 });

module.exports = {
  Subscription: mongoose.model('Subscription', userSubscriptionSchema),
};

