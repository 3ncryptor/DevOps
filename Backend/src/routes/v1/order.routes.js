import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrder,
  cancelOrderHandler,
  payOrder,
  getStoreOrdersHandler,
  getStoreOrderStats,
  processOrderHandler,
  shipOrderHandler,
  deliverOrderHandler
} from "../../controllers/order.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { requireApprovedSeller, checkOrderAccess, checkStoreOwnership } from "../../middlewares/ownership.middleware.js";
import ROLES from "../../constants/roles.js";

const router = Router();

// All order routes require authentication
router.use(authenticate);

// ============== BUYER ROUTES ==============

/**
 * @route   POST /api/v1/orders
 * @desc    Create orders from cart (checkout)
 * @access  Private (USER)
 */
router.post(
  "/",
  authorizeRoles(ROLES.USER),
  createOrder
);

/**
 * @route   GET /api/v1/orders/my-orders
 * @desc    Get my orders
 * @access  Private (USER)
 */
router.get(
  "/my-orders",
  authorizeRoles(ROLES.USER),
  getMyOrders
);

/**
 * @route   GET /api/v1/orders/:orderId
 * @desc    Get order by ID
 * @access  Private (Owner or SELLER of store or ADMIN)
 */
router.get(
  "/:orderId",
  checkOrderAccess,
  getOrder
);

/**
 * @route   POST /api/v1/orders/:orderId/cancel
 * @desc    Cancel order
 * @access  Private (Owner or ADMIN)
 */
router.post(
  "/:orderId/cancel",
  authorizeRoles(ROLES.USER, ROLES.SUPER_ADMIN),
  cancelOrderHandler
);

/**
 * @route   POST /api/v1/orders/:orderId/pay
 * @desc    Pay for order (mock payment)
 * @access  Private (Owner)
 */
router.post(
  "/:orderId/pay",
  authorizeRoles(ROLES.USER),
  payOrder
);

// ============== SELLER ROUTES ==============

/**
 * @route   GET /api/v1/orders/store/:storeId
 * @desc    Get orders for a store
 * @access  Private (SELLER - store owner)
 */
router.get(
  "/store/:storeId",
  authorizeRoles(ROLES.SELLER),
  requireApprovedSeller,
  checkStoreOwnership,
  getStoreOrdersHandler
);

/**
 * @route   GET /api/v1/orders/store/:storeId/stats
 * @desc    Get order statistics for a store
 * @access  Private (SELLER - store owner)
 */
router.get(
  "/store/:storeId/stats",
  authorizeRoles(ROLES.SELLER),
  requireApprovedSeller,
  checkStoreOwnership,
  getStoreOrderStats
);

/**
 * @route   POST /api/v1/orders/:orderId/process
 * @desc    Mark order as processing
 * @access  Private (SELLER)
 */
router.post(
  "/:orderId/process",
  authorizeRoles(ROLES.SELLER),
  requireApprovedSeller,
  processOrderHandler
);

/**
 * @route   POST /api/v1/orders/:orderId/ship
 * @desc    Ship order
 * @access  Private (SELLER)
 */
router.post(
  "/:orderId/ship",
  authorizeRoles(ROLES.SELLER),
  requireApprovedSeller,
  shipOrderHandler
);

/**
 * @route   POST /api/v1/orders/:orderId/deliver
 * @desc    Mark order as delivered
 * @access  Private (SELLER or ADMIN)
 */
router.post(
  "/:orderId/deliver",
  authorizeRoles(ROLES.SELLER, ROLES.SUPER_ADMIN),
  deliverOrderHandler
);

export default router;
