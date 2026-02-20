import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },

        personal: {
            firstName: {
                type: String,
                trim: true,
                required: true,
            },
            lastName: {
                type: String,
                trim: true,
                required: true,
            },
            dateOfBirth: Date,
            gender: {
                type: String,
                enum: ['MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED'],
                default: 'UNSPECIFIED',
            },
            profileImageUrl: String,
        },

        contact: {
            primaryPhone: {
                type: String,
                trim: true,
            },
            secondaryPhone: String,
        },

        preferences: {
            language: {
                type: String,
                default: 'en',
            },
            currency: {
                type: String,
                default: 'USD',
            },
            marketingOptIn: {
                type: Boolean,
                default: false,
            },
        },
    },
    { timestamps: true }
);

export const UserProfile = mongoose.model('UserProfile', userProfileSchema);
