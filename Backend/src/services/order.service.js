import mongoose from "mongoose";
import { Order } from "../models/order.model.js";
import { OrderStatusHistory } from "../models/orderStatusHistory.model.js";
import { Payment } from "../models/payment.model.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { ProductPrice } from "../models/productPrice.model.js";
import { Store } from "../models/store.model.js";
import { Seller } from "../models/seller.model.js";
import { ApiError } from "../utils/ApiError.js";
import { createAuditLog } from "./audit.service.js";
import { withTransaction } from "../db/transactions.js";
import { confirmReservation, releaseReservedStock, reserveStock } from "./inventory.service.js";
import { validateCartForCheckout, groupCartByStore, clearCart } from "./cart.service.js";
import {
  ORDER_STATUS,
  ORDER_STATUS_TRANSITIONS,
  CANCELLABLE_STATUSES,
  AUDIT_ACTION,
  PAGINATION
} from "../constants/index.js";

/**
 * Generate order number
 */
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

/**
 * Validate status transition
 */
const isValidTransition = (currentStatus, newStatus) => {
  const validTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] || [];
  return validTransitions.includes(newStatus);
};

/**
 * Create orders from cart (one order per store)
 */
const createOrdersFromCart = async (userId, shippingAddress, billingAddress, ipAddress = null, userAgent = null) => {
  // Validate cart
  const validation = await validateCartForCheckout(userId);
  if (!validation.isValid) {
    throw new ApiError(422, "Cart has invalid items", validation.issues);
  }

  // Group cart by store
  const { stores } = await groupCartByStore(userId);

  if (stores.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  // Validate addresses
  if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.addressLine1) {
    throw new ApiError(400, "Valid shipping address is required");
  }

  const orders = await withTransaction(async (session) => {
    const createdOrders = [];

    for (const storeGroup of stores) {
      // Reserve stock for all items
      for (const item of storeGroup.items) {
        await reserveStock(item.productId._id, item.quantity, session);
      }

      // Create order items with snapshots
      const orderItems = storeGroup.items.map(item => ({
        productId: item.productId._id,
        titleSnapshot: item.productId.identity?.title,
        skuSnapshot: item.productId.attributes?.sku,
        priceSnapshot: item.price?.unitPrice,
        quantity: item.quantity
      }));

      // Calculate pricing
      const subtotal = storeGroup.subtotal;
      const tax = Math.round(subtotal * 0.1 * 100) / 100; // 10% tax
      const shippingFee = subtotal >= 50 ? 0 : 5.99; // Free shipping over $50
      const totalAmount = Math.round((subtotal + tax + shippingFee) * 100) / 100;

      // Create order
      const [order] = await Order.create([{
        userId,
        storeId: storeGroup.storeId,
        orderNumber: generateOrderNumber(),
        items: orderItems,
        shippingAddress: {
          fullName: shippingAddress.fullName,
          phoneNumber: shippingAddress.phoneNumber,
          addressLine1: shippingAddress.addressLine1,
          addressLine2: shippingAddress.addressLine2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country || "US"
        },
        billingAddress: billingAddress || shippingAddress,
        pricing: {
          subtotal,
          tax,
          shippingFee,
          totalAmount
        },
        status: ORDER_STATUS.CREATED
      }], { session });

      // Create status history
      await OrderStatusHistory.create([{
        orderId: order._id,
        status: ORDER_STATUS.CREATED,
        changedBy: userId,
        actorRole: "USER",
        changedAt: new Date()
      }], { session });

      createdOrders.push(order);
    }

    // Clear cart
    await Cart.findOneAndUpdate(
      { userId },
      { items: [] },
      { session }
    );

    return createdOrders;
  });

  // Log order creation
  for (const order of orders) {
    await createAuditLog({
      action: AUDIT_ACTION.ORDER_CREATE,
      userId,
      targetType: "Order",
      targetId: order._id,
      details: { totalAmount: order.pricing.totalAmount },
      ipAddress,
      userAgent,
      storeId: order.storeId
    });
  }

  return orders;
};

/**
 * Get order by ID
 */
const getOrderById = async (orderId, userId = null, role = null) => {
  const order = await Order.findById(orderId)
    .populate("storeId", "storeIdentity.name storeIdentity.slug")
    .populate("userId", "email");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Access control
  if (role !== "SUPER_ADMIN" && userId) {
    const isBuyer = order.userId._id.toString() === userId;
    
    if (!isBuyer && role === "SELLER") {
      // Check if seller owns the store
      const seller = await Seller.findOne({ userId });
      const store = await Store.findById(order.storeId._id);
      if (!seller || store.sellerId.toString() !== seller._id.toString()) {
        throw new ApiError(403, "Access denied");
      }
    } else if (!isBuyer) {
      throw new ApiError(403, "Access denied");
    }
  }

  // Get status history
  const statusHistory = await OrderStatusHistory.find({ orderId })
    .sort({ changedAt: 1 })
    .lean();

  // Get payment info
  const payment = await Payment.findOne({ orderId }).lean();

  return {
    ...order.toObject(),
    statusHistory,
    payment
  };
};

/**
 * Get orders for user (buyer)
 */
const getUserOrders = async (userId, { status, page = 1, limit = 20 }) => {
  const query = { userId };

  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;
  const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate("storeId", "storeIdentity.name storeIdentity.slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Order.countDocuments(query)
  ]);

  return {
    orders,
    pagination: {
      page,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit)
    }
  };
};

/**
 * Get orders for store (seller)
 */
const getStoreOrders = async (storeId, sellerId, { status, page = 1, limit = 20 }) => {
  // Verify store ownership
  const store = await Store.findById(storeId);
  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  if (store.sellerId.toString() !== sellerId.toString()) {
    throw new ApiError(403, "Access denied");
  }

  const query = { storeId };

  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;
  const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate("userId", "email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Order.countDocuments(query)
  ]);

  return {
    orders,
    pagination: {
      page,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit)
    }
  };
};

/**
 * Update order status
 */
const updateOrderStatus = async (orderId, newStatus, actorId, actorRole, ipAddress = null, userAgent = null) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Validate transition
  if (!isValidTransition(order.status, newStatus)) {
    throw new ApiError(400, `Cannot transition from ${order.status} to ${newStatus}`);
  }

  const previousStatus = order.status;

  await withTransaction(async (session) => {
    // Update order status
    order.status = newStatus;
    await order.save({ session });

    // Record status change
    await OrderStatusHistory.create([{
      orderId: order._id,
      status: newStatus,
      changedBy: actorId,
      actorRole,
      changedAt: new Date()
    }], { session });

    // Handle stock adjustments based on status
    if (newStatus === ORDER_STATUS.PAID) {
      // Confirm reservations (deduct from available stock)
      for (const item of order.items) {
        await confirmReservation(item.productId, item.quantity, session);
      }
    } else if (newStatus === ORDER_STATUS.CANCELLED || newStatus === ORDER_STATUS.REFUNDED) {
      // Release reservations if order was not yet paid
      if (previousStatus === ORDER_STATUS.CREATED) {
        for (const item of order.items) {
          await releaseReservedStock(item.productId, item.quantity, session);
        }
      }
    }
  });

  // Log status change
  await createAuditLog({
    action: AUDIT_ACTION.ORDER_STATUS_CHANGE,
    userId: actorId,
    userRole: actorRole,
    targetType: "Order",
    targetId: orderId,
    details: { previousStatus, newStatus },
    ipAddress,
    userAgent,
    storeId: order.storeId
  });

  return getOrderById(orderId);
};

/**
 * Cancel order (buyer or admin)
 */
const cancelOrder = async (orderId, userId, role, reason, ipAddress = null, userAgent = null) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Check if user can cancel
  if (role !== "SUPER_ADMIN" && order.userId.toString() !== userId) {
    throw new ApiError(403, "You cannot cancel this order");
  }

  // Check if order is cancellable
  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    throw new ApiError(400, `Cannot cancel order with status ${order.status}`);
  }

  return updateOrderStatus(orderId, ORDER_STATUS.CANCELLED, userId, role, ipAddress, userAgent);
};

/**
 * Mark order as paid
 */
const markOrderPaid = async (orderId, paymentInfo, ipAddress = null, userAgent = null) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.status !== ORDER_STATUS.CREATED) {
    throw new ApiError(400, "Order is not awaiting payment");
  }

  await withTransaction(async (session) => {
    // Create payment record
    await Payment.create([{
      orderId,
      userId: order.userId,
      provider: paymentInfo.provider || "MOCK",
      amount: order.pricing.totalAmount,
      currency: "USD",
      status: "SUCCESS",
      transactionReference: paymentInfo.transactionReference || `PAY-${Date.now()}`
    }], { session });

    // Update order status and confirm stock
    order.status = ORDER_STATUS.PAID;
    await order.save({ session });

    // Confirm reservations
    for (const item of order.items) {
      await confirmReservation(item.productId, item.quantity, session);
    }

    // Record status change
    await OrderStatusHistory.create([{
      orderId: order._id,
      status: ORDER_STATUS.PAID,
      changedBy: order.userId,
      actorRole: "SYSTEM",
      changedAt: new Date()
    }], { session });
  });

  // Log payment
  await createAuditLog({
    action: AUDIT_ACTION.PAYMENT_SUCCESS,
    userId: order.userId,
    targetType: "Order",
    targetId: orderId,
    details: { amount: order.pricing.totalAmount },
    ipAddress,
    userAgent,
    storeId: order.storeId
  });

  return getOrderById(orderId);
};

/**
 * Process order (seller marks as processing)
 */
const processOrder = async (orderId, sellerId, ipAddress = null, userAgent = null) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Verify seller owns the store
  const store = await Store.findById(order.storeId);
  const seller = await Seller.findById(sellerId);
  
  if (!seller || store.sellerId.toString() !== seller._id.toString()) {
    throw new ApiError(403, "Access denied");
  }

  return updateOrderStatus(orderId, ORDER_STATUS.PROCESSING, seller.userId, "SELLER", ipAddress, userAgent);
};

/**
 * Ship order (seller)
 */
const shipOrder = async (orderId, sellerId, trackingInfo, ipAddress = null, userAgent = null) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Verify seller owns the store
  const store = await Store.findById(order.storeId);
  const seller = await Seller.findById(sellerId);
  
  if (!seller || store.sellerId.toString() !== seller._id.toString()) {
    throw new ApiError(403, "Access denied");
  }

  if (order.status !== ORDER_STATUS.PROCESSING) {
    throw new ApiError(400, "Order must be in processing status");
  }

  // Could store tracking info - for now just update status
  return updateOrderStatus(orderId, ORDER_STATUS.SHIPPED, seller.userId, "SELLER", ipAddress, userAgent);
};

/**
 * Mark order as delivered
 */
const deliverOrder = async (orderId, actorId, actorRole, ipAddress = null, userAgent = null) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.status !== ORDER_STATUS.SHIPPED) {
    throw new ApiError(400, "Order must be shipped first");
  }

  return updateOrderStatus(orderId, ORDER_STATUS.DELIVERED, actorId, actorRole, ipAddress, userAgent);
};

/**
 * Get order statistics for seller
 */
const getOrderStats = async (storeId) => {
  const stats = await Order.aggregate([
    { $match: { storeId: mongoose.Types.ObjectId(storeId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalValue: { $sum: "$pricing.totalAmount" }
      }
    }
  ]);

  const statusMap = {};
  stats.forEach(s => {
    statusMap[s._id] = { count: s.count, totalValue: s.totalValue };
  });

  return statusMap;
};

export {
  createOrdersFromCart,
  getOrderById,
  getUserOrders,
  getStoreOrders,
  updateOrderStatus,
  cancelOrder,
  markOrderPaid,
  processOrder,
  shipOrder,
  deliverOrder,
  getOrderStats,
  isValidTransition
};
