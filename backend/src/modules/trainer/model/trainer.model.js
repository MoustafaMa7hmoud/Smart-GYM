const mongoose = require('mongoose');

/**
 * Trainer profile — extends User with gym-specific fields.
 * One-to-one with User (unique: true on user field).
 */
const trainerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Trainer must be linked to a user"],
    },
    specializations: {
      type: [String],
      required: [true, "At least one specialization is required"],
      validate: {
        validator: (arr) => arr.length >= 1 && arr.length <= 10,
        message: "Specializations must be between 1 and 10 items",
      },
      enum: {
        values: ["weightLoss", "bodyBuilding", "cardio", "yoga", "crossfit", "pilates", "nutrition", "rehabilitation", "kickboxing", "stretching"],
        message: "Invalid specialization: {VALUE}",
      },
    },
    bio: {
      type: String,
      required: [true, "Trainer bio is required"],
      minlength: [50, "Bio must be at least 50 characters"],
      maxlength: [1000, "Bio cannot exceed 1000 characters"],
      trim: true,
    },
    experience: {
      type: Number,
      required: [true, "Years of experience is required"],
      min: [0, "Experience cannot be negative"],
      max: [50, "Experience cannot exceed 50 years"],
    },
    certificates: [
      {
        name: {
          type: String,
          required: [true, "Certificate name is required"],
          trim: true,
          maxlength: [100, "Certificate name cannot exceed 100 characters"],
        },
        issuedBy: {
          type: String,
          required: [true, "Issuing organization is required"],
          trim: true,
        },
        issuedAt: {
          type: Date,
          required: [true, "Issue date is required"],
          validate: {
            validator: (v) => v <= new Date(),
            message: "Issue date cannot be in the future",
          },
        },
        imageUrl: { type: String },
      },
    ],
    sessionPrice: {
      type: Number,
      required: [true, "Session price is required"],
      min: [0, "Session price cannot be negative"],
      max: [10000, "Session price cannot exceed 10,000 EGP"],
    },
    currency: {
      type: String,
      default: "EGP",
      enum: { values: ["EGP", "USD"], message: "Currency must be EGP or USD" },
    },
    availability: [
      {
        day: {
          type: String,
          required: true,
          enum: {
            values: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
            message: "Invalid day: {VALUE}",
          },
        },
        slots: [
          {
            startTime: {
              type: String,
              required: true,
              match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be in HH:MM format"],
            },
            endTime: {
              type: String,
              required: true,
              match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be in HH:MM format"],
            },
            isBooked: { type: Boolean, default: false },
          },
        ],
      },
    ],
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    totalClients: { type: Number, default: 0, min: 0 },
    isApproved: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

trainerSchema.index({ user: 1 });
trainerSchema.index({ specializations: 1, isApproved: 1, isAvailable: 1 });
trainerSchema.index({ "rating.average": -1 });

module.exports = mongoose.model('Trainer', trainerSchema);
