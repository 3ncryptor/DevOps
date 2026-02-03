import mongoose from "mongoose";

const productImageSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true
    },

    url: {
      type: String,
      required: true
    },

    altText: String,

    sortOrder: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export const ProductImage = mongoose.model(
  "ProductImage",
  productImageSchema
);
