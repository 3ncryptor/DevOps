/**
 * Payment Controller
 * Handles HTTP requests for payment operations
 */

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  initiatePayment,
  processPayment,
  quickPay,
  processRefund,
  getPaymentById,
  getUserPayments,
  getOrderPayments,
  getPaymentStats
} from "../services/payment.service.js";

/**
 * Extract client info from request
 */
const getClientInfo = (req) => ({
  ipAddress: req.ip || req.connection?.remoteAddress,
  userAgent: req.get("User-Agent")
});

// ============== USER ENDPOINTS ==============

/**
 * @desc    Initiate payment for an order
 * @route   POST /api/v1/payments/initiate
 * @access  Private (USER)
 */
export const initiatePaymentHandler = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getClientInfo(req);
  const { orderId, provider } = req.body;

  const payment = await initiatePayment(
    orderId,
    req.user.id,
    provider,
    ipAddress,
    userAgent
  );

  res
    .status(201)
    .json(new ApiResponse(201, payment, "Payment initiated successfully"));
});

/**
 * @desc    Process/Complete a payment
 * @route   POST /api/v1/payments/:paymentId/process
 * @access  Private (USER)
 */
export const processPaymentHandler = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getClientInfo(req);
  const { paymentId } = req.params;

  const result = await processPayment(
    paymentId,
    req.user.id,
    ipAddress,
    userAgent
  );

  res
    .status(200)
    .json(new ApiResponse(200, result, "Payment processed successfully"));
});

/**
 * @desc    Quick pay - initiate and process in one step
 * @route   POST /api/v1/payments/quick-pay
 * @access  Private (USER)
 */
export const quickPayHandler = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getClientInfo(req);
  const { orderId, provider } = req.body;

  const result = await quickPay(
    orderId,
    req.user.id,
    provider,
    ipAddress,
    userAgent
  );

  res
    .status(200)
    .json(new ApiResponse(200, result, "Payment successful"));
});

/**
 * @desc    Get payment by ID
 * @route   GET /api/v1/payments/:paymentId
 * @access  Private (Owner or ADMIN)
 */
export const getPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const isAdmin = req.user.role === "SUPER_ADMIN";

  const payment = await getPaymentById(paymentId, req.user.id, isAdmin);

  res
    .status(200)
    .json(new ApiResponse(200, payment, "Payment retrieved successfully"));
});

/**
 * @desc    Get my payments
 * @route   GET /api/v1/payments/my-payments
 * @access  Private (USER)
 */
export const getMyPayments = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;

  const result = await getUserPayments(req.user.id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    status
  });

  res
    .status(200)
    .json(new ApiResponse(200, result, "Payments retrieved successfully"));
});

/**
 * @desc    Get payments for an order
 * @route   GET /api/v1/payments/order/:orderId
 * @access  Private (Owner or ADMIN)
 */
export const getPaymentsForOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const payments = await getOrderPayments(orderId);

  res
    .status(200)
    .json(new ApiResponse(200, payments, "Order payments retrieved successfully"));
});

// ============== ADMIN ENDPOINTS ==============

/**
 * @desc    Process refund for a payment
 * @route   POST /api/v1/payments/:paymentId/refund
 * @access  Private (ADMIN)
 */
export const refundPaymentHandler = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getClientInfo(req);
  const { paymentId } = req.params;
  const { reason } = req.body;

  const result = await processRefund(
    paymentId,
    req.user.id,
    reason,
    ipAddress,
    userAgent
  );

  res
    .status(200)
    .json(new ApiResponse(200, result, "Refund processed successfully"));
});

/**
 * @desc    Get payment statistics
 * @route   GET /api/v1/payments/stats
 * @access  Private (ADMIN)
 */
export const getPaymentStatsHandler = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const stats = await getPaymentStats(startDate, endDate);

  res
    .status(200)
    .json(new ApiResponse(200, stats, "Payment statistics retrieved successfully"));
});

export default {
  initiatePaymentHandler,
  processPaymentHandler,
  quickPayHandler,
  getPayment,
  getMyPayments,
  getPaymentsForOrder,
  refundPaymentHandler,
  getPaymentStatsHandler
};
