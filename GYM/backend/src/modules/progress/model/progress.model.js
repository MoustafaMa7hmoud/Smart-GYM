const mongoose = require('mongoose');

const bodyMeasurementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recorder is required'],
    },
    measurementDate: {
      type: Date,
      required: [true, 'Measurement date is required'],
      validate: {
        validator: (v) => v <= new Date(),
        message: 'Measurement date cannot be in the future',
      },
    },
    weight: {
      type: Number,
      min: [20, 'Weight seems too low (min 20 kg)'],
      max: [300, 'Weight seems too high (max 300 kg)'],
    },
    bodyFat: {
      type: Number,
      min: [2, 'Body fat seems too low'],
      max: [60, 'Body fat seems too high'],
    },
    chest: { type: Number, min: [0, 'Chest measurement must be positive'] },
    waist: { type: Number, min: [0, 'Waist measurement must be positive'] },
    notes: { type: String, maxlength: [500, 'Notes too long'], trim: true },
  },
  {
    timestamps: true,
  }
);

bodyMeasurementSchema.index({ user: 1, measurementDate: -1 });

const workoutLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: [true, 'Exercise is required'],
    },
    sets: [
      {
        setNumber: { type: Number, required: true, min: 1 },
        reps: { type: Number, required: true, min: [1, 'Reps must be at least 1'] },
        weight: { type: Number, min: [0, 'Weight cannot be negative'] },
        notes: { type: String, maxlength: [200, 'Set notes too long'], trim: true },
      },
    ],
    notes: { type: String, maxlength: [500, 'Notes too long'], trim: true },
    workoutDate: {
      type: Date,
      required: [true, 'Workout date is required'],
      validate: {
        validator: (v) => v <= new Date(),
        message: 'Workout date cannot be in the future',
      },
    },
  },
  { timestamps: true }
);

workoutLogSchema.index({ user: 1, workoutDate: -1 });

module.exports = {
  BodyMeasurement: mongoose.model('BodyMeasurement', bodyMeasurementSchema),
  WorkoutLog: mongoose.model('WorkoutLog', workoutLogSchema),
};
