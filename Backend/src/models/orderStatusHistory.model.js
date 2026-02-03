import mongoose from "mongoose";

const orderStatusHistorySchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },

    status: {
      type: String,
      required: true
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    actorRole: {
      type: String,
      enum: ["USER", "SELLER", "SUPER_ADMIN"]
    },

    changedAt: {
      type: Date,
      default: Date.now
    }
  }
);

export const OrderStatusHistory = mongoose.model(
  "OrderStatusHistory",
  orderStatusHistorySchema
);
