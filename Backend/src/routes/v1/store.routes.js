import { Router } from "express";
import {
  createStoreHandler,
  getMyStores,
  getMyStoreById,
  updateMyStore,
  closeMyStore,
  listAllStores,
  getStoreBySlugHandler,
  getStoreByIdHandler
} from "../../controllers/store.controller.js";
import { authenticate, optionalAuth } from "../../middlewares/auth.middleware.js";
import { requireApprovedSeller } from "../../middlewares/ownership.middleware.js";
import { checkStoreOwnership } from "../../middlewares/ownership.middleware.js";

const router = Router();

// ============== PUBLIC ROUTES ==============

/**
 * @route   GET /api/v1/stores
 * @desc    List all active stores
 * @access  Public
 */
router.get("/", optionalAuth, listAllStores);

/**
 * @route   GET /api/v1/stores/id/:storeId
 * @desc    Get store by ID
 * @access  Public
 */
router.get("/id/:storeId", optionalAuth, getStoreByIdHandler);

/**
 * @route   GET /api/v1/stores/:slug
 * @desc    Get store by slug (must be last to not conflict with other routes)
 * @access  Public
 */
router.get("/:slug", optionalAuth, getStoreBySlugHandler);

// ============== SELLER ROUTES ==============

/**
 * @route   POST /api/v1/stores
 * @desc    Create a new store
 * @access  Private (Approved SELLER)
 */
router.post(
  "/",
  authenticate,
  requireApprovedSeller,
  createStoreHandler
);

/**
 * @route   GET /api/v1/stores/my-stores
 * @desc    Get all my stores
 * @access  Private (SELLER)
 */
router.get(
  "/my-stores",
  authenticate,
  requireApprovedSeller,
  getMyStores
);

/**
 * @route   GET /api/v1/stores/my-stores/:storeId
 * @desc    Get my store by ID
 * @access  Private (SELLER)
 */
router.get(
  "/my-stores/:storeId",
  authenticate,
  requireApprovedSeller,
  checkStoreOwnership,
  getMyStoreById
);

/**
 * @route   PATCH /api/v1/stores/my-stores/:storeId
 * @desc    Update my store
 * @access  Private (SELLER)
 */
router.patch(
  "/my-stores/:storeId",
  authenticate,
  requireApprovedSeller,
  checkStoreOwnership,
  updateMyStore
);

/**
 * @route   POST /api/v1/stores/my-stores/:storeId/close
 * @desc    Close my store
 * @access  Private (SELLER)
 */
router.post(
  "/my-stores/:storeId/close",
  authenticate,
  requireApprovedSeller,
  checkStoreOwnership,
  closeMyStore
);

export default router;
