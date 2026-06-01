const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: [true, 'Subscription is required'],
    },
    checkIn: {
      type: Date,
      required: [true, "Check-in time is required"],
      validate: {
        validator: (v) => v <= new Date(),
        message: "Check-in time cannot be in the future",
      },
    },
    checkOut: {
      type: Date,
      validate: {
        validator: function (v) {
          return !v || v > this.checkIn;
        },
        message: "Check-out must be after check-in",
      },
    },
    duration: {
      type: Number, // in minutes
      min: [0, "Duration cannot be negative"],
    },
    method: {
      type: String,
      enum: {
        values: ["qrCode", "fingerprint", "manual", "rfid", "faceId"],
        message: "Invalid check-in method: {VALUE}",
      },
      default: "qrCode",
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin or staff who verified
    },
    notes: { type: String, maxlength: [300, "Notes too long"], trim: true },
    isManualEntry: { type: Boolean, default: false },
  },
  { timestamps: true }
);
 
// Auto-calculate duration on checkout
attendanceSchema.pre("save", function (next) {
  if (this.checkOut && this.checkIn) {
    this.duration = Math.round((this.checkOut - this.checkIn) / (1000 * 60));
  }
  next();
});
 
// Prevent duplicate active check-in (no checkout yet)
attendanceSchema.index({ user: 1, checkIn: -1 });
attendanceSchema.index({ subscription: 1, checkIn: -1 });
attendanceSchema.index({ checkIn: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
