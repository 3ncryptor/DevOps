import mongoose from 'mongoose';

const sellerMetricsDailySchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true,
        index: true,
    },

    date: {
        type: Date,
        required: true,
        index: true,
    },

    totalOrders: Number,
    totalRevenue: Number,
    uniqueCustomers: Number,
    refunds: Number,
});

sellerMetricsDailySchema.index({ storeId: 1, date: 1 }, { unique: true });

export const SellerMetricsDaily = mongoose.model(
    'SellerMetricsDaily',
    sellerMetricsDailySchema
);
