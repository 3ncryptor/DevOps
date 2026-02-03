import { Router } from "express";
import {
  initiatePaymentHandler,
  processPaymentHandler,
  quickPayHandler,
  getPayment,
  getMyPayments,
  getPaymentsForOrder,
  refundPaymentHandler,
  getPaymentStatsHandler
} from "../../controllers/payment.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import ROLES from "../../constants/roles.js";

const router = Router();

// All payment routes require authentication
router.use(authenticate);

// ============== USER ROUTES ==============

/**
 * @route   POST /api/v1/payments/initiate
 * @desc    Initiate payment for an order
 * @access  Private (USER)
 */
router.post(
  "/initiate",
  authorizeRoles(ROLES.USER),
  initiatePaymentHandler
);

/**
 * @route   POST /api/v1/payments/quick-pay
 * @desc    Quick pay - initiate and process in one step
 * @access  Private (USER)
 */
router.post(
  "/quick-pay",
  authorizeRoles(ROLES.USER),
  quickPayHandler
);

/**
 * @route   GET /api/v1/payments/my-payments
 * @desc    Get my payments
 * @access  Private (USER)
 */
router.get(
  "/my-payments",
  authorizeRoles(ROLES.USER),
  getMyPayments
);

/**
 * @route   POST /api/v1/payments/:paymentId/process
 * @desc    Process/Complete a payment
 * @access  Private (USER)
 */
router.post(
  "/:paymentId/process",
  authorizeRoles(ROLES.USER),
  processPaymentHandler
);

/**
 * @route   GET /api/v1/payments/order/:orderId
 * @desc    Get payments for an order
 * @access  Private (USER, ADMIN)
 */
router.get(
  "/order/:orderId",
  authorizeRoles(ROLES.USER, ROLES.SUPER_ADMIN),
  getPaymentsForOrder
);

/**
 * @route   GET /api/v1/payments/:paymentId
 * @desc    Get payment by ID
 * @access  Private (Owner or ADMIN)
 */
router.get(
  "/:paymentId",
  authorizeRoles(ROLES.USER, ROLES.SUPER_ADMIN),
  getPayment
);

// ============== ADMIN ROUTES ==============

/**
 * @route   GET /api/v1/payments/stats
 * @desc    Get payment statistics
 * @access  Private (ADMIN)
 */
router.get(
  "/stats",
  authorizeRoles(ROLES.SUPER_ADMIN),
  getPaymentStatsHandler
);

/**
 * @route   POST /api/v1/payments/:paymentId/refund
 * @desc    Process refund for a payment
 * @access  Private (ADMIN)
 */
router.post(
  "/:paymentId/refund",
  authorizeRoles(ROLES.SUPER_ADMIN),
  refundPaymentHandler
);

export default router;
