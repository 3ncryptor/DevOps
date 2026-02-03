import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    provider: {
      type: String,
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["INITIATED", "SUCCESS", "FAILED", "REFUNDED"],
      index: true
    },

    transactionReference: String
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
