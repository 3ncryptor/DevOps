/**
 * User Service
 * Handles user management, profiles, and addresses
 */

import { User } from "../models/users.model.js";
import { UserProfile } from "../models/userProfile.model.js";
import { Address } from "../models/address.model.js";
import ApiError from "../utils/ApiError.js";
import { withTransaction } from "../db/transactions.js";
import { createAuditLog } from "./audit.service.js";
import {
  ACCOUNT_STATUS,
  AUDIT_ACTION,
  PAGINATION
} from "../constants/platform.js";

// ============== PROFILE MANAGEMENT ==============

/**
 * Get user profile with details
 */
export const getUserProfile = async (userId) => {
  const [user, profile] = await Promise.all([
    User.findById(userId).select("-passwordHash"),
    UserProfile.findOne({ userId })
  ]);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return {
    user,
    profile
  };
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, profileData, ipAddress, userAgent) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Build the update object matching the schema structure
  const updates = {
    personal: {},
    contact: {},
    preferences: {}
  };

  // Personal fields
  if (profileData.firstName !== undefined) {
    updates.personal.firstName = profileData.firstName;
  }
  if (profileData.lastName !== undefined) {
    updates.personal.lastName = profileData.lastName;
  }
  if (profileData.dateOfBirth !== undefined) {
    updates.personal.dateOfBirth = profileData.dateOfBirth;
  }
  if (profileData.gender !== undefined) {
    updates.personal.gender = profileData.gender;
  }
  if (profileData.avatarUrl !== undefined) {
    updates.personal.profileImageUrl = profileData.avatarUrl;
  }

  // Contact fields
  if (profileData.phone !== undefined) {
    updates.contact.primaryPhone = profileData.phone;
  }

  // Clean up empty nested objects
  if (Object.keys(updates.personal).length === 0) delete updates.personal;
  if (Object.keys(updates.contact).length === 0) delete updates.contact;
  if (Object.keys(updates.preferences).length === 0) delete updates.preferences;

  // Update or create profile
  let profile = await UserProfile.findOne({ userId });
  
  if (profile) {
    // Deep merge for nested objects
    if (updates.personal) {
      profile.personal = { ...profile.personal.toObject?.() || profile.personal, ...updates.personal };
    }
    if (updates.contact) {
      profile.contact = { ...profile.contact.toObject?.() || profile.contact, ...updates.contact };
    }
    if (updates.preferences) {
      profile.preferences = { ...profile.preferences.toObject?.() || profile.preferences, ...updates.preferences };
    }
    await profile.save();
  } else {
    // For new profiles, firstName and lastName are required
    if (!updates.personal?.firstName || !updates.personal?.lastName) {
      throw new ApiError(400, "First name and last name are required to create a profile");
    }
    profile = await UserProfile.create({
      userId,
      ...updates
    });
  }

  // Log audit
  await createAuditLog({
    action: AUDIT_ACTION.USER_UPDATE,
    userId,
    targetType: "UserProfile",
    targetId: profile._id,
    details: { updatedFields: Object.keys(updates) },
    ipAddress,
    userAgent
  });

  return profile;
};

// ============== ADDRESS MANAGEMENT ==============

/**
 * Get user addresses
 */
export const getUserAddresses = async (userId) => {
  return Address.find({ userId, isDeleted: { $ne: true } })
    .sort({ isDefault: -1, createdAt: -1 })
    .lean();
};

/**
 * Add new address
 */
export const addAddress = async (userId, addressData) => {
  // If this is the first address or marked as default, update other addresses
  if (addressData.isDefault) {
    await Address.updateMany(
      { userId, type: addressData.type },
      { isDefault: false }
    );
  }

  // Check if this is the first address
  const existingCount = await Address.countDocuments({
    userId,
    type: addressData.type,
    isDeleted: { $ne: true }
  });

  const address = await Address.create({
    userId,
    ...addressData,
    isDefault: existingCount === 0 ? true : addressData.isDefault
  });

  return address;
};

/**
 * Update address
 */
export const updateAddress = async (userId, addressId, addressData) => {
  const address = await Address.findOne({
    _id: addressId,
    userId,
    isDeleted: { $ne: true }
  });

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  // If setting as default, unset others
  if (addressData.isDefault) {
    await Address.updateMany(
      { userId, type: address.type, _id: { $ne: addressId } },
      { isDefault: false }
    );
  }

  // Update allowed fields
  const allowedFields = [
    "label",
    "fullName",
    "phone",
    "addressLine1",
    "addressLine2",
    "city",
    "state",
    "postalCode",
    "country",
    "isDefault"
  ];

  for (const field of allowedFields) {
    if (addressData[field] !== undefined) {
      address[field] = addressData[field];
    }
  }

  await address.save();
  return address;
};

/**
 * Delete address (soft delete)
 */
export const deleteAddress = async (userId, addressId) => {
  const address = await Address.findOne({
    _id: addressId,
    userId,
    isDeleted: { $ne: true }
  });

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  address.isDeleted = true;
  await address.save();

  // If deleted address was default, make another one default
  if (address.isDefault) {
    const nextAddress = await Address.findOne({
      userId,
      type: address.type,
      isDeleted: { $ne: true }
    });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  return { message: "Address deleted successfully" };
};

/**
 * Set address as default
 */
export const setDefaultAddress = async (userId, addressId) => {
  const address = await Address.findOne({
    _id: addressId,
    userId,
    isDeleted: { $ne: true }
  });

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  // Unset other defaults of same type
  await Address.updateMany(
    { userId, type: address.type, _id: { $ne: addressId } },
    { isDefault: false }
  );

  address.isDefault = true;
  await address.save();

  return address;
};

// ============== ADMIN FUNCTIONS ==============

/**
 * Get all users with pagination and filters (admin)
 */
export const getAllUsers = async (options = {}) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    role,
    status,
    search
  } = options;

  const skip = (page - 1) * limit;
  const query = {};

  if (role) {
    query.role = role;
  }

  if (status) {
    query.accountStatus = status;
  }

  if (search) {
    query.email = { $regex: search, $options: "i" };
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query)
  ]);

  // Get profiles for users
  const userIds = users.map(u => u._id);
  const profiles = await UserProfile.find({ userId: { $in: userIds } }).lean();
  const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

  // Merge profiles with users
  const usersWithProfiles = users.map(user => ({
    ...user,
    profile: profileMap.get(user._id.toString()) || null
  }));

  return {
    users: usersWithProfiles,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get user by ID with full details (admin)
 */
export const getUserById = async (userId) => {
  const [user, profile, addresses] = await Promise.all([
    User.findById(userId).select("-passwordHash").lean(),
    UserProfile.findOne({ userId }).lean(),
    Address.find({ userId, isDeleted: { $ne: true } }).lean()
  ]);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return {
    user,
    profile,
    addresses
  };
};

/**
 * Suspend user (admin)
 */
export const suspendUser = async (userId, adminId, reason, ipAddress, userAgent) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === "SUPER_ADMIN") {
    throw new ApiError(403, "Cannot suspend admin users");
  }

  if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
    throw new ApiError(400, "User is already suspended");
  }

  user.accountStatus = ACCOUNT_STATUS.SUSPENDED;
  await user.save();

  // Log audit
  await createAuditLog({
    action: AUDIT_ACTION.USER_SUSPEND,
    userId: adminId,
    targetType: "User",
    targetId: userId,
    details: { reason },
    ipAddress,
    userAgent
  });

  return user;
};

/**
 * Activate user (admin)
 */
export const activateUser = async (userId, adminId, ipAddress, userAgent) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.accountStatus === ACCOUNT_STATUS.ACTIVE) {
    throw new ApiError(400, "User is already active");
  }

  user.accountStatus = ACCOUNT_STATUS.ACTIVE;
  await user.save();

  // Log audit
  await createAuditLog({
    action: AUDIT_ACTION.USER_ACTIVATE,
    userId: adminId,
    targetType: "User",
    targetId: userId,
    ipAddress,
    userAgent
  });

  return user;
};

/**
 * Get user statistics (admin)
 */
export const getUserStats = async () => {
  const stats = await User.aggregate([
    {
      $facet: {
        byRole: [
          { $group: { _id: "$role", count: { $sum: 1 } } }
        ],
        byStatus: [
          { $group: { _id: "$accountStatus", count: { $sum: 1 } } }
        ],
        total: [
          { $count: "count" }
        ],
        recentSignups: [
          {
            $match: {
              createdAt: {
                $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          },
          { $count: "count" }
        ]
      }
    }
  ]);

  const result = stats[0];
  
  return {
    total: result.total[0]?.count || 0,
    recentSignups: result.recentSignups[0]?.count || 0,
    byRole: Object.fromEntries(result.byRole.map(r => [r._id, r.count])),
    byStatus: Object.fromEntries(result.byStatus.map(s => [s._id, s.count]))
  };
};

export default {
  getUserProfile,
  updateUserProfile,
  getUserAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getAllUsers,
  getUserById,
  suspendUser,
  activateUser,
  getUserStats
};
