const mongoose = require('mongoose');
const { GOALS, LEVELS, PLAN_CREATED_BY } = require('../../../utils/constants');

const workoutPlanSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Plan title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // null = public/template plan
    },
    goal: {
      type: String,
      required: [true, "Workout goal is required"],
      enum: {
        values: ["weightLoss", "muscleGain", "endurance", "flexibility", "generalFitness", "rehabilitation", "sportPerformance"],
        message: "Invalid goal: {VALUE}",
      },
    },
    level: {
      type: String,
      required: [true, "Level is required"],
      enum: {
        values: ["beginner", "intermediate", "advanced"],
        message: "Level must be beginner, intermediate, or advanced",
      },
    },
    durationWeeks: {
      type: Number,
      required: [true, "Plan duration in weeks is required"],
      min: [1, "Duration must be at least 1 week"],
      max: [52, "Duration cannot exceed 52 weeks"],
    },
    daysPerWeek: {
      type: Number,
      required: [true, "Training days per week is required"],
      min: [1, "Must train at least 1 day per week"],
      max: [7, "Cannot train more than 7 days per week"],
    },
    days: [
      {
        dayNumber: {
          type: Number,
          required: true,
          min: 1,
          max: 7,
        },
        dayName: {
          type: String,
          enum: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
        },
        muscleGroups: {
          type: [String],
          enum: ["chest", "back", "shoulders", "biceps", "triceps", "legs", "glutes", "core", "calves", "fullBody", "rest"],
        },
        isRestDay: { type: Boolean, default: false },
        exercises: [
          {
            exercise: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Exercise",
              required: [true, "Exercise reference is required"],
            },
            order: { type: Number, required: true, min: 1 },
            sets: {
              type: Number,
              required: [true, "Number of sets is required"],
              min: [1, "Must have at least 1 set"],
              max: [20, "Cannot exceed 20 sets"],
            },
            reps: {
              type: String, // Can be "12" or "8-12" or "AMRAP"
              match: [/^(\d+(-\d+)?|AMRAP|failure)$/i, "Invalid reps format (e.g. 12, 8-12, AMRAP)"],
            },
            duration: { type: Number, min: 0 }, // seconds (for timed exercises)
            restSeconds: {
              type: Number,
              default: 60,
              min: [0, "Rest cannot be negative"],
              max: [600, "Rest cannot exceed 10 minutes"],
            },
            weight: { type: String, maxlength: 50 }, // "bodyweight", "50kg", etc.
            tempo: {
              type: String,
              match: [/^\d{4}$/, "Tempo format must be 4 digits (e.g. 3010)"],
            },
            notes: { type: String, maxlength: 200 },
            supersetWith: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Exercise",
            },
          },
        ],
        warmUp: { type: String, maxlength: 500 },
        coolDown: { type: String, maxlength: 500 },
        estimatedDuration: { type: Number, min: 0 }, // minutes
      },
    ],
    isTemplate: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
    tags: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: "Cannot have more than 10 tags",
      },
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    status: {
      type: String,
      enum: { values: ["draft", "active", "archived"], message: "Invalid status" },
      default: "draft",
    },
  },
  { timestamps: true }
);
 
workoutPlanSchema.index({ createdBy: 1, status: 1 });
workoutPlanSchema.index({ assignedTo: 1, status: 1 });
workoutPlanSchema.index({ goal: 1, level: 1, isPublic: 1 });

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
