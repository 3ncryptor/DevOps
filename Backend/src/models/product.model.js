import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    identity: {
      title: {
        type: String,
        required: true,
        trim: true
      },
      subtitle: String,
      description: {
        type: String,
        required: true
      }
    },

    attributes: {
      brand: String,
      sku: {
        type: String,
        index: true
      },
      weight: Number,
      dimensions: {
        length: Number,
        width: Number,
        height: Number
      }
    },

    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
      index: true
    }
  },
  { timestamps: true }
);

productSchema.index({ storeId: 1, status: 1 });

export const Product = mongoose.model("Product", productSchema);
