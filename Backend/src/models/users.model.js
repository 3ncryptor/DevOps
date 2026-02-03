import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    passwordHash: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["USER", "SELLER", "SUPER_ADMIN"],
      default: "USER",
      index: true
    },

    accountStatus: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "DELETED"],
      default: "ACTIVE"
    },

    authProvider: {
      type: String,
      enum: ["LOCAL"],
      default: "LOCAL"
    },

    emailVerified: {
      type: Boolean,
      default: false
    },

    phoneVerified: {
      type: Boolean,
      default: false
    },

    lastLoginAt: Date,

    deletedAt: Date
  },
  { timestamps: true }
);

// Exclude sensitive fields when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.__v;
  return user;
};

// Index for common queries
userSchema.index({ accountStatus: 1 });

export const User = mongoose.model("User", userSchema);
