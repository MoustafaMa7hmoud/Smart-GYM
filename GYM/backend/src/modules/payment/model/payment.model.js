const mongoose = require('mongoose');
const { PAYMENT_STATUSES } = require('../../../utils/constants');

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserSubscription",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1, "Amount must be greater than 0"],
    },
    currency: {
      type: String,
      default: "EGP",
      enum: { values: ["EGP", "USD"], message: "Invalid currency" },
    },
    method: {
      type: String,
      required: [true, "Payment method is required"],
      enum: {
        values: ["cash", "card", "vodafoneCash", "instaPay", "fawry", "stripe", "paypal"],
        message: "Invalid payment method: {VALUE}",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "completed", "failed", "refunded", "cancelled"],
        message: "Invalid payment status: {VALUE}",
      },
      default: "pending",
    },
    transactionId: {
      type: String,
      trim: true,
    },
    receiptUrl: { type: String },
    refundedAt: { type: Date },
    refundAmount: {
      type: Number,
      min: [0, "Refund amount cannot be negative"],
      validate: {
        validator: function (v) {
          return !v || v <= this.amount;
        },
        message: "Refund amount cannot exceed original payment amount",
      },
    },
    refundReason: { type: String, maxlength: [300, "Refund reason too long"], trim: true },
    gateway: {
      name: { type: String, trim: true },       // e.g. 'stripe', 'paymob'
      chargeId: { type: String, trim: true },
      response: { type: mongoose.Schema.Types.Mixed }, // raw gateway response
    },
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    paidAt: { type: Date },
    notes: { type: String, maxlength: [500, "Notes too long"] },
  },
  { timestamps: true }
);

// Auto-generate invoice number before saving
paymentSchema.pre("save", async function (next) {
  if (!this.invoiceNumber && this.status === "completed") {
    const count = await mongoose.model("Payment").countDocuments();
    this.invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
    this.paidAt = this.paidAt || new Date();
  }
  next();
});

paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ transactionId: 1 }, { sparse: true });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
