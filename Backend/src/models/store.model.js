import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
    {
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Seller',
            required: true,
            index: true,
        },

        storeIdentity: {
            name: {
                type: String,
                required: true,
            },
            slug: {
                type: String,
                required: true,
                unique: true,
                lowercase: true,
                index: true,
            },
        },

        description: String,

        branding: {
            logoUrl: String,
            bannerUrl: String,
        },

        location: {
            addressLine1: String,
            city: String,
            state: String,
            postalCode: String,
            country: String,
        },

        storeStatus: {
            type: String,
            enum: ['ACTIVE', 'SUSPENDED', 'CLOSED'],
            default: 'ACTIVE',
        },
    },
    { timestamps: true }
);

export const Store = mongoose.model('Store', storeSchema);
