import { Router } from "express";
import {
  getMe,
  updateMe,
  getMyAddresses,
  addNewAddress,
  updateAddressHandler,
  deleteAddressHandler,
  setDefaultAddressHandler
} from "../../controllers/user.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

// All user routes require authentication
router.use(authenticate);

// ============== PROFILE ROUTES ==============

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", getMe);

/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.patch("/me", updateMe);

// ============== ADDRESS ROUTES ==============

/**
 * @route   GET /api/v1/users/addresses
 * @desc    Get my addresses
 * @access  Private
 */
router.get("/addresses", getMyAddresses);

/**
 * @route   POST /api/v1/users/addresses
 * @desc    Add new address
 * @access  Private
 */
router.post("/addresses", addNewAddress);

/**
 * @route   PATCH /api/v1/users/addresses/:addressId
 * @desc    Update address
 * @access  Private
 */
router.patch("/addresses/:addressId", updateAddressHandler);

/**
 * @route   DELETE /api/v1/users/addresses/:addressId
 * @desc    Delete address
 * @access  Private
 */
router.delete("/addresses/:addressId", deleteAddressHandler);

/**
 * @route   POST /api/v1/users/addresses/:addressId/default
 * @desc    Set address as default
 * @access  Private
 */
router.post("/addresses/:addressId/default", setDefaultAddressHandler);

export default router;
