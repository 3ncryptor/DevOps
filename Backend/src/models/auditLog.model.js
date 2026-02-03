import mongoose from "mongoose";
import { AUDIT_ACTION_VALUES } from "../constants/platform.js";

const auditLogSchema = new mongoose.Schema(
  {
    // Who performed the action
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    userRole: {
      type: String
    },

    // What action was performed
    action: {
      type: String,
      required: true,
      enum: AUDIT_ACTION_VALUES,
      index: true
    },

    // What was affected
    targetType: {
      type: String,
      index: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true
    },

    // State changes (for UPDATE actions)
    previousState: {
      type: mongoose.Schema.Types.Mixed
    },
    newState: {
      type: mongoose.Schema.Types.Mixed
    },

    // Additional context
    details: {
      type: mongoose.Schema.Types.Mixed
    },

    // Request metadata
    ipAddress: String,
    userAgent: String,

    // For seller/store specific logs
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      index: true
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      index: true
    }
  },
  { 
    timestamps: true,
    // Optimize for read-heavy operations
    autoIndex: true
  }
);

// Compound indexes for common queries
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
auditLogSchema.index({ sellerId: 1, createdAt: -1 });
auditLogSchema.index({ storeId: 1, createdAt: -1 });

// TTL index for automatic cleanup (optional - 90 days retention)
// auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
