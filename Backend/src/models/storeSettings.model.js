import mongoose from "mongoose";

const storeSettingsSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      unique: true,
      index: true
    },

    commerce: {
      currency: {
        type: String,
        default: "USD"
      },

      taxInclusivePricing: {
        type: Boolean,
        default: false
      }
    },

    fulfillment: {
      processingTimeInDays: {
        type: Number,
        default: 1,
        min: 0
      },

      allowCancellations: {
        type: Boolean,
        default: true
      },

      cancellationWindowHours: {
        type: Number,
        default: 24,
        min: 0
      },

      allowReturns: {
        type: Boolean,
        default: true
      },

      returnWindowDays: {
        type: Number,
        default: 7,
        min: 0
      }
    },

    notifications: {
      orderPlaced: {
        type: Boolean,
        default: true
      },
      orderCancelled: {
        type: Boolean,
        default: true
      },
      lowInventory: {
        type: Boolean,
        default: true
      }
    },

    storefront: {
      isVisible: {
        type: Boolean,
        default: true
      },

      maintenanceMode: {
        type: Boolean,
        default: false
      }
    }
  },
  { timestamps: true }
);

export const StoreSettings = mongoose.model(
  "StoreSettings",
  storeSettingsSchema
);
