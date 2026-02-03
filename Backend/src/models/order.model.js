import mongoose from "mongoose";
import { ORDER_STATUS_VALUES } from "../constants/orderStatus.js";

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true
    },

    items: [
      {
        productId: mongoose.Schema.Types.ObjectId,
        titleSnapshot: String,
        skuSnapshot: String,
        priceSnapshot: Number,
        quantity: Number
      }
    ],

    shippingAddress: {
      fullName: String,
      phoneNumber: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },

    billingAddress: {
      fullName: String,
      phoneNumber: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },

    pricing: {
      subtotal: Number,
      tax: Number,
      shippingFee: Number,
      totalAmount: Number
    },

    status: {
      type: String,
      enum: ORDER_STATUS_VALUES,
      default: "CREATED",
      index: true
    },

    notes: String
  },
  { timestamps: true }
);

// Compound indexes
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ storeId: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model("Order", orderSchema);
