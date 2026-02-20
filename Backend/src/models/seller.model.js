import mongoose from 'mongoose';

const sellerSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },

        business: {
            legalName: {
                type: String,
                required: true,
            },
            displayName: {
                type: String,
                required: true,
            },
            businessType: {
                type: String,
                enum: ['INDIVIDUAL', 'SOLE_PROPRIETOR', 'COMPANY'],
                required: true,
            },
            taxIdentifier: String,
        },

        contact: {
            email: {
                type: String,
                required: true,
            },
            phone: String,
        },

        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'],
            default: 'PENDING',
        },

        approvedAt: Date,
        suspendedAt: Date,
    },
    { timestamps: true }
);

export const Seller = mongoose.model('Seller', sellerSchema);
