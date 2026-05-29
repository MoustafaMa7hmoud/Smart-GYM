const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Machine name is required"],
      trim: true,
      unique: true,
      minlength: [3, "Machine name must be at least 3 characters"],
      maxlength: [100, "Machine name cannot exceed 100 characters"],
    },
    nameAr: { type: String, trim: true },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["cardio", "strength", "freeWeights", "functional", "stretching", "recovery"],
        message: "Invalid category: {VALUE}",
      },
    },
    muscleGroups: {
      type: [String],
      required: [true, "At least one muscle group is required"],
      enum: {
        values: ["chest", "back", "shoulders", "biceps", "triceps", "legs", "glutes", "core", "calves", "fullBody"],
        message: "Invalid muscle group: {VALUE}",
      },
      validate: {
        validator: (arr) => arr.length >= 1,
        message: "At least one muscle group is required",
      },
    },
    serialNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    brand: { type: String, trim: true, maxlength: [50, "Brand name too long"] },
    purchaseDate: { type: Date },
    lastMaintenanceDate: { type: Date },
    nextMaintenanceDate: { type: Date },
    status: {
      type: String,
      enum: {
        values: ["active", "maintenance", "outOfService", "retired"],
        message: "Invalid machine status: {VALUE}",
      },
      default: "active",
    },
    location: {
      floor: { type: Number, min: [0, "Floor cannot be negative"] },
      zone: {
        type: String,
        enum: { values: ["A", "B", "C", "D", "E"], message: "Invalid zone" },
      },
    },
    images: [{ type: String }],
    instructions: { type: String, maxlength: [2000, "Instructions too long"], trim: true },
    notes: { type: String, maxlength: [500, "Notes too long"], trim: true },
  },
  { timestamps: true }
);
 
machineSchema.index({ category: 1, status: 1 });
machineSchema.index({ muscleGroups: 1 });
 
// ── Exercise Schema ───────────────────────────────────────────────────────────
const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Exercise name is required"],
      trim: true,
      unique: true,
      minlength: [3, "Exercise name must be at least 3 characters"],
      maxlength: [100, "Exercise name cannot exceed 100 characters"],
    },
    nameAr: { type: String, trim: true },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["strength", "cardio", "flexibility", "balance", "plyometric", "calisthenics"],
        message: "Invalid category: {VALUE}",
      },
    },
    muscleGroups: {
      primary: {
        type: [String],
        required: [true, "Primary muscle group is required"],
        enum: ["chest", "back", "shoulders", "biceps", "triceps", "legs", "glutes", "core", "calves", "fullBody"],
      },
      secondary: {
        type: [String],
        enum: ["chest", "back", "shoulders", "biceps", "triceps", "legs", "glutes", "core", "calves", "fullBody"],
        default: [],
      },
    },
    difficulty: {
      type: String,
      required: [true, "Difficulty is required"],
      enum: {
        values: ["beginner", "intermediate", "advanced"],
        message: "Difficulty must be beginner, intermediate, or advanced",
      },
    },
    equipment: {
      type: [String],
      enum: {
        values: ["barbell", "dumbbell", "machine", "cable", "bodyweight", "resistance band", "kettlebell", "medicine ball", "trx"],
        message: "Invalid equipment: {VALUE}",
      },
      default: ["bodyweight"],
    },
    machine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Machine",
    },
    instructions: {
      type: [String],
      validate: {
        validator: (arr) => arr.length >= 1,
        message: "At least one instruction step is required",
      },
    },
    tips: { type: [String], default: [] },
    cautions: { type: [String], default: [] },
    videoUrl: {
      type: String,
      match: [/^https?:\/\/.+/, "Please enter a valid URL"],
    },
    images: [{ type: String }],
    metValue: {
      type: Number,
      min: [0.5, "MET value too low"],
      max: [20, "MET value too high"],
      comment: "Metabolic Equivalent of Task for calorie estimation",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
 
exerciseSchema.index({ category: 1, difficulty: 1 });
exerciseSchema.index({ "muscleGroups.primary": 1 });

module.exports = mongoose.model('Machine', machineSchema);
