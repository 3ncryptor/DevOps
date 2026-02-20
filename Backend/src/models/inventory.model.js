import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
            unique: true,
        },

        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },

        availableStock: {
            type: Number,
            required: true,
            min: 0,
        },

        reservedStock: {
            type: Number,
            default: 0,
            min: 0,
        },

        reorderThreshold: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

export const Inventory = mongoose.model('Inventory', inventorySchema);
