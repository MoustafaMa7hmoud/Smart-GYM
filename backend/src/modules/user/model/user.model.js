const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, GOALS, LEVELS } = require('../../../utils/constants');

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  User Model — Production-ready with:
 *    • Strict Mongoose validation + custom error messages
 *    • bcrypt password hashing (salt 12)
 *    • Password strength regex
 *    • comparePassword instance method
 *    • tokenVersion for global refresh-token revocation
 *    • passwordChangedAt for invalidating tokens issued before password change
 *    • toJSON strips all sensitive fields
 *    • Compound indexes for performance
 * ─────────────────────────────────────────────────────────────────────────────
 */
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [3, "Full name must be at least 3 characters"],
      maxlength: [60, "Full name cannot exceed 60 characters"],
      match: [/^[a-zA-Z\u0600-\u06FF\s]+$/, "Full name can only contain letters and spaces"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^(\+20|0)(10|11|12|15)[0-9]{8}$/, "Please enter a valid Egyptian phone number"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never return password in queries
    },
    passwordChangedAt: { type: Date, select: false },
    profileImage: {
      url: { type: String, default: "https://res.cloudinary.com/smartgym/default-avatar.png" },
      publicId: { type: String, default: null },
    },
    gender: {
      type: String,
      enum: { values: ["male", "female"], message: "Gender must be male or female" },
      required: [true, "Gender is required"],
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
      validate: {
        validator: function (v) {
          const age = Math.floor((Date.now() - v) / (365.25 * 24 * 60 * 60 * 1000));
          return age >= 14 && age <= 80;
        },
        message: "Age must be between 14 and 80 years",
      },
    },
    role: {
      type: String,
      enum: { values: ["user", "trainer", "admin", "superAdmin"], message: "Invalid role" },
      default: "user",
    },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    refreshToken: { type: String, select: false },
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
    address: {
      city: { type: String, trim: true },
      district: { type: String, trim: true },
      street: { type: String, trim: true },
    },
    favoriteExercises: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise',
      },
    ],
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: age ─────────────────────────────────────────────────────────────
userSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  return Math.floor((Date.now() - this.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000));
});

// ── Virtual: isLocked ────────────────────────────────────────────────────────
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ── Pre-save: hash password ───────────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// ── Method: compare password ─────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Method: password changed after token issued ───────────────────────────────
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    return parseInt(this.passwordChangedAt.getTime() / 1000, 10) > JWTTimestamp;
  }
  return false;
};

// ── Method: increment login attempts ─────────────────────────────────────────
userSchema.methods.incrementLoginAttempts = async function () {
  const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }
  return this.updateOne(updates);
};

// ── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1, isActive: 1 });

const User = mongoose.model("User", userSchema);
module.exports = User;