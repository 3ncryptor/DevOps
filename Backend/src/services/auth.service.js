import { User } from "../models/users.model.js";
import { RefreshToken } from "../models/refreshToken.model.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken
} from "../utils/jwt.js";
import { ApiError } from "../utils/ApiError.js";
import { ACCOUNT_STATUS, TOKEN_EXPIRY, AUDIT_ACTION } from "../constants/index.js";
import { createAuditLog } from "./audit.service.js";

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Validate registration input
 */
const validateRegistrationInput = (email, password) => {
  const errors = [];

  if (!email || !EMAIL_REGEX.test(email)) {
    errors.push({ field: "email", message: "Valid email is required" });
  }

  if (!password) {
    errors.push({ field: "password", message: "Password is required" });
  } else if (!PASSWORD_REGEX.test(password)) {
    errors.push({
      field: "password",
      message: "Password must be at least 8 characters with uppercase, lowercase, and number"
    });
  }

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", errors);
  }
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  if (!password) {
    throw new ApiError(400, "Password is required");
  }
  if (!PASSWORD_REGEX.test(password)) {
    throw new ApiError(
      400,
      "Password must be at least 8 characters with uppercase, lowercase, and number"
    );
  }
};

/**
 * Generate tokens for a user
 */
const generateTokens = async (user) => {
  const accessToken = generateAccessToken({
    id: user._id,
    role: user.role
  });

  const refreshTokenValue = generateRefreshToken({
    id: user._id,
    tokenVersion: Date.now() // Used for token rotation validation
  });

  // Store refresh token in database
  await RefreshToken.create({
    userId: user._id,
    token: refreshTokenValue,
    expiresAt: new Date(Date.now() + TOKEN_EXPIRY.REFRESH_TOKEN_MS)
  });

  return { accessToken, refreshToken: refreshTokenValue };
};

/**
 * Sanitize user object (remove sensitive fields)
 */
const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.passwordHash;
  delete userObj.__v;
  return userObj;
};

/**
 * Register a new user
 */
const registerUser = async ({ email, password, role = "USER" }, ipAddress = null, userAgent = null) => {
  validateRegistrationInput(email, password);

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  // Validate role
  const validRoles = ["USER", "SELLER"];
  if (role && !validRoles.includes(role)) {
    throw new ApiError(400, "Invalid role. Allowed roles: USER, SELLER");
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
    role: role || "USER",
    accountStatus: ACCOUNT_STATUS.ACTIVE
  });

  // Log registration
  await createAuditLog({
    action: AUDIT_ACTION.USER_REGISTER,
    userId: user._id,
    targetType: "User",
    targetId: user._id,
    details: { email: normalizedEmail, role: user.role },
    ipAddress,
    userAgent
  });

  return sanitizeUser(user);
};

/**
 * Login user and generate tokens
 */
const loginUser = async ({ email, password }, ipAddress = null, userAgent = null) => {
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Check if account is active
  if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    throw new ApiError(403, "Account is suspended or deleted");
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Generate new tokens
  const { accessToken, refreshToken } = await generateTokens(user);

  // Update last login timestamp
  await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

  // Log login
  await createAuditLog({
    action: AUDIT_ACTION.USER_LOGIN,
    userId: user._id,
    targetType: "User",
    targetId: user._id,
    ipAddress,
    userAgent
  });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken
  };
};

/**
 * Refresh access token using refresh token (with rotation)
 * Implements refresh token rotation for security
 */
const refreshAccessToken = async (refreshTokenValue, ipAddress = null, userAgent = null) => {
  if (!refreshTokenValue) {
    throw new ApiError(400, "Refresh token is required");
  }

  // Verify the refresh token JWT
  let decoded;
  try {
    decoded = verifyToken(refreshTokenValue, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    // If token is invalid/expired, revoke all tokens for this token (if found)
    await RefreshToken.updateOne(
      { token: refreshTokenValue },
      { revoked: true }
    );
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  // Find the refresh token in database
  const storedToken = await RefreshToken.findOne({
    token: refreshTokenValue,
    revoked: false
  });

  if (!storedToken) {
    // Token reuse detected - potential token theft
    // Revoke all refresh tokens for this user
    await RefreshToken.updateMany(
      { userId: decoded.id },
      { revoked: true }
    );
    throw new ApiError(401, "Refresh token has been revoked. Please login again.");
  }

  // Check if token is expired in database
  if (storedToken.expiresAt < new Date()) {
    await RefreshToken.updateOne(
      { _id: storedToken._id },
      { revoked: true }
    );
    throw new ApiError(401, "Refresh token has expired");
  }

  // Get user
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, "User not found");
  }

  if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    throw new ApiError(403, "Account is suspended or deleted");
  }

  // ROTATION: Revoke the old refresh token
  await RefreshToken.updateOne(
    { _id: storedToken._id },
    { revoked: true }
  );

  // Generate new tokens (both access and refresh - rotation)
  const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken: newRefreshToken
  };
};

/**
 * Logout user - revoke refresh token
 */
const logoutUser = async (userId, refreshTokenValue = null, ipAddress = null, userAgent = null) => {
  if (refreshTokenValue) {
    // Revoke specific token
    await RefreshToken.updateOne(
      { token: refreshTokenValue, userId },
      { revoked: true }
    );
  } else {
    // Revoke all tokens for user
    await RefreshToken.updateMany(
      { userId },
      { revoked: true }
    );
  }

  // Log logout
  await createAuditLog({
    action: AUDIT_ACTION.USER_LOGOUT,
    userId,
    targetType: "User",
    targetId: userId,
    ipAddress,
    userAgent
  });

  return true;
};

/**
 * Logout from all devices - revoke all refresh tokens
 */
const logoutAllDevices = async (userId, ipAddress = null, userAgent = null) => {
  const result = await RefreshToken.updateMany(
    { userId, revoked: false },
    { revoked: true }
  );

  // Log logout from all devices
  await createAuditLog({
    action: AUDIT_ACTION.USER_LOGOUT,
    userId,
    targetType: "User",
    targetId: userId,
    details: { allDevices: true, revokedCount: result.modifiedCount },
    ipAddress,
    userAgent
  });

  return { revokedCount: result.modifiedCount };
};

/**
 * Change password
 */
const changePassword = async (userId, currentPassword, newPassword, ipAddress = null, userAgent = null) => {
  validatePassword(newPassword);

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Verify current password
  const isValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  // Ensure new password is different
  const isSamePassword = await comparePassword(newPassword, user.passwordHash);
  if (isSamePassword) {
    throw new ApiError(400, "New password must be different from current password");
  }

  // Hash and update password
  const newPasswordHash = await hashPassword(newPassword);
  await User.findByIdAndUpdate(userId, { passwordHash: newPasswordHash });

  // Revoke all refresh tokens (force re-login on all devices)
  await RefreshToken.updateMany(
    { userId, revoked: false },
    { revoked: true }
  );

  // Log password change
  await createAuditLog({
    action: AUDIT_ACTION.USER_UPDATE,
    userId,
    targetType: "User",
    targetId: userId,
    details: { field: "password" },
    ipAddress,
    userAgent
  });

  return true;
};

/**
 * Get user by ID
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return sanitizeUser(user);
};

/**
 * Clean up expired refresh tokens (for scheduled job)
 */
const cleanupExpiredTokens = async () => {
  const result = await RefreshToken.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { revoked: true, updatedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    ]
  });
  return result.deletedCount;
};

export {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllDevices,
  changePassword,
  getUserById,
  cleanupExpiredTokens,
  validatePassword,
  sanitizeUser
};
