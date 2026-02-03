import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        storeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Store",
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        addedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

export const Cart = mongoose.model("Cart", cartSchema);
