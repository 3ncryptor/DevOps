import mongoose from "mongoose";

const productPriceSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    currency: {
      type: String,
      required: true,
      default: "USD"
    },

    effectiveFrom: {
      type: Date,
      default: Date.now
    },

    effectiveTo: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

productPriceSchema.index({ productId: 1, effectiveFrom: -1 });

export const ProductPrice = mongoose.model(
  "ProductPrice",
  productPriceSchema
);
