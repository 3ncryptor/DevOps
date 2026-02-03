/**
 * User Controller
 * Handles user profile, addresses, and account management
 */

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  getUserProfile,
  updateUserProfile,
  getUserAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from "../services/user.service.js";

/**
 * Extract client info from request
 */
const getClientInfo = (req) => ({
  ipAddress: req.ip || req.connection?.remoteAddress,
  userAgent: req.get("User-Agent")
});

// ============== PROFILE ENDPOINTS ==============

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/users/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const result = await getUserProfile(req.user.id);

  res
    .status(200)
    .json(new ApiResponse(200, result, "Profile retrieved successfully"));
});

/**
 * @desc    Update current user profile
 * @route   PATCH /api/v1/users/me
 * @access  Private
 */
export const updateMe = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getClientInfo(req);

  const profile = await updateUserProfile(
    req.user.id,
    req.body,
    ipAddress,
    userAgent
  );

  res
    .status(200)
    .json(new ApiResponse(200, profile, "Profile updated successfully"));
});

// ============== ADDRESS ENDPOINTS ==============

/**
 * @desc    Get my addresses
 * @route   GET /api/v1/users/addresses
 * @access  Private
 */
export const getMyAddresses = asyncHandler(async (req, res) => {
  const addresses = await getUserAddresses(req.user.id);

  res
    .status(200)
    .json(new ApiResponse(200, addresses, "Addresses retrieved successfully"));
});

/**
 * @desc    Add new address
 * @route   POST /api/v1/users/addresses
 * @access  Private
 */
export const addNewAddress = asyncHandler(async (req, res) => {
  const address = await addAddress(req.user.id, req.body);

  res
    .status(201)
    .json(new ApiResponse(201, address, "Address added successfully"));
});

/**
 * @desc    Update address
 * @route   PATCH /api/v1/users/addresses/:addressId
 * @access  Private
 */
export const updateAddressHandler = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  const address = await updateAddress(req.user.id, addressId, req.body);

  res
    .status(200)
    .json(new ApiResponse(200, address, "Address updated successfully"));
});

/**
 * @desc    Delete address
 * @route   DELETE /api/v1/users/addresses/:addressId
 * @access  Private
 */
export const deleteAddressHandler = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  const result = await deleteAddress(req.user.id, addressId);

  res
    .status(200)
    .json(new ApiResponse(200, result, "Address deleted successfully"));
});

/**
 * @desc    Set address as default
 * @route   POST /api/v1/users/addresses/:addressId/default
 * @access  Private
 */
export const setDefaultAddressHandler = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  const address = await setDefaultAddress(req.user.id, addressId);

  res
    .status(200)
    .json(new ApiResponse(200, address, "Default address set successfully"));
});

export default {
  getMe,
  updateMe,
  getMyAddresses,
  addNewAddress,
  updateAddressHandler,
  deleteAddressHandler,
  setDefaultAddressHandler
};
