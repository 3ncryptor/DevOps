import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    label: {
      type: String,
      enum: ["HOME", "WORK", "OTHER"],
      default: "HOME"
    },

    type: {
      type: String,
      enum: ["SHIPPING", "BILLING"],
      required: true
    },

    recipient: {
      fullName: {
        type: String,
        required: true
      },
      phoneNumber: {
        type: String,
        required: true
      }
    },

    addressLine1: {
      type: String,
      required: true
    },
    addressLine2: String,

    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    postalCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },

    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

addressSchema.index({ userId: 1, type: 1 });

export const Address = mongoose.model("Address", addressSchema);
