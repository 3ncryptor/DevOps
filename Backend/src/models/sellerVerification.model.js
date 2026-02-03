import mongoose from "mongoose";

const sellerVerificationSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true
    },

    verificationStatus: {
      type: String,
      enum: ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true
    },

    documents: [
      {
        documentType: {
          type: String,
          enum: [
            "GOVT_ID",
            "BUSINESS_REGISTRATION",
            "TAX_DOCUMENT",
            "ADDRESS_PROOF",
            "BANK_STATEMENT"
          ],
          required: true
        },

        documentNumber: {
          type: String
        },

        fileUrl: {
          type: String,
          required: true
        },

        status: {
          type: String,
          enum: ["PENDING", "APPROVED", "REJECTED"],
          default: "PENDING"
        },

        rejectionReason: {
          type: String
        },

        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User" // SUPER_ADMIN
    },

    reviewedAt: {
      type: Date
    },

    remarks: {
      type: String
    }
  },
  { timestamps: true }
);

// Index is already defined inline on sellerId field

export const SellerVerification = mongoose.model(
  "SellerVerification",
  sellerVerificationSchema
);
