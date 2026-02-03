import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  createOrdersFromCart,
  getOrderById,
  getUserOrders,
  getStoreOrders,
  cancelOrder,
  markOrderPaid,
  processOrder,
  shipOrder,
  deliverOrder,
  getOrderStats
} from "../services/order.service.js";

/**
 * Extract client info from request
 */
const getClientInfo = (req) => ({
  ipAddress: req.ip || req.connection?.remoteAddress,
  userAgent: req.get("User-Agent")
});

// ============== BUYER ENDPOINTS ==============

/**
 * @desc    Create orders from cart (checkout)
 * @route   POST /api/v1/orders
 * @access  Private (USER)
 */
const createOrder = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getClientInfo(req);
  const { shippingAddress, billingAddress } = req.body;

  const orders = await createOrdersFromCart(
    req.user.id,
    shippingAddress,
    billingAddress,
    ipAddress,
    userAgent
  );

  res
    .status(201)
    .json(new ApiResponse(201, orders, "Orders created successfully"));
});

/**
 * @desc    Get my orders
 * @route   GET /api/v1/orders/my-orders
 * @access  Private (USER)
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const result = await getUserOrders(req.user.id, {
    status,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res
    .status(200)
    .json(new ApiResponse(200, result, "Orders retrieved"));
});

/**
 * @desc    Get order by ID
 * @route   GET /api/v1/orders/:orderId
 * @access  Private
 */
const getOrder = asyncHandler(async (req, res) => {
  const order = await getOrderById(req.params.orderId, req.user.id, req.user.role);

  res
    .status(200)
    .json(new ApiResponse(200, order, "Order retrieved"));
});

/**
 * @desc    Cancel order
 * @route   POST /api/v1/orders/:orderId/cancel
 * @access  Private (USER - own orders, ADMIN - any)
 */
const cancelOrderHandler = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getClientInfo(req);
  const { reason } = req.body;

  const order = await cancelOrder(
    req.params.orderId,
    req.user.id,
    req.user.role,
    reason,
    ipAddress,
    userAgent
  );

  res
    .status(200)
    .json(new ApiResponse(200, order, "Order cancelled"));
});

/**
 * @desc    Mock payment for order
 * @route   POST /api/v1/orders/:orderId/pay
 * @access  Private (USER)
 */
const payOrder = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getClientInfo(req);
  const { provider, transactionReference } = req.body;

  const order = await markOrderPaid(
    req.params.orderId,
    { provider, transactionReference },
    ipAddress,
    userAgent
  );

  res
    .status(200)
    .json(new ApiResponse(200, order, "Payment successful"));
});

// ============== SELLER ENDPOINTS ==============

/**
 * @desc    Get orders for my store
 * @route   GET /api/v1/orders/store/:storeId
 * @access  Private (SELLER)
 */
const getStoreOrdersHandler = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const result = await getStoreOrders(
    req.params.storeId,
    req.seller._id,
    {
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    }
  );

  res
    .status(200)
    .json(new ApiResponse(200, result, "Store orders retrieved"));
});

/**
 * @desc    Get store order statistics
 * @route   GET /api/v1/orders/store/:storeId/stats
 * @access  Private (SELLER)
 */
const getStoreOrderStats = asyncHandler(async (req, res) => {
  const stats = await getOrderStats(req.params.storeId);

  res
    .status(200)
    .json(new ApiResponse(200, stats, "Order statistics retrieved"));
});

/**
 * @desc    Process order (mark as processing)
 * @route   POST /api/v1/orders/:orderId/process
 * @access  Private (SELLER)
 */
const processOrderHandler = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getClientInfo(req);

  const order = await processOrder(
    req.params.orderId,
    req.seller._id,
    ipAddress,
    userAgent
  );

  res
    .status(200)
    .json(new ApiResponse(200, order, "Order is now being processed"));
});

/**
 * @desc    Ship order
 * @route   POST /api/v1/orders/:orderId/ship
 * @access  Private (SELLER)
 */
const shipOrderHandler = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getClientInfo(req);
  const { trackingNumber, carrier } = req.body;

  const order = await shipOrder(
    req.params.orderId,
    req.seller._id,
    { trackingNumber, carrier },
    ipAddress,
    userAgent
  );

  res
    .status(200)
    .json(new ApiResponse(200, order, "Order shipped"));
});

/**
 * @desc    Mark order as delivered
 * @route   POST /api/v1/orders/:orderId/deliver
 * @access  Private (SELLER or ADMIN)
 */
const deliverOrderHandler = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getClientInfo(req);

  // Could be seller or admin
  const actorId = req.seller ? req.seller.userId : req.user.id;
  const actorRole = req.user.role;

  const order = await deliverOrder(
    req.params.orderId,
    actorId,
    actorRole,
    ipAddress,
    userAgent
  );

  res
    .status(200)
    .json(new ApiResponse(200, order, "Order marked as delivered"));
});

export {
  // Buyer endpoints
  createOrder,
  getMyOrders,
  getOrder,
  cancelOrderHandler,
  payOrder,
  // Seller endpoints
  getStoreOrdersHandler,
  getStoreOrderStats,
  processOrderHandler,
  shipOrderHandler,
  deliverOrderHandler
};
