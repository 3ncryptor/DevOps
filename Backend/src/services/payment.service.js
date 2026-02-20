/**
 * Payment Service
 * Handles payment processing, refunds, and payment records
 *
 * NOTE: This service is designed to support multiple payment providers.
 * Currently implements a mock provider for development/testing.
 * Replace mock provider with real implementations (Stripe, Razorpay, etc.)
 */

import { Payment } from '../models/payment.model.js';
import { Order } from '../models/order.model.js';
import { OrderStatusHistory } from '../models/orderStatusHistory.model.js';
import { Inventory } from '../models/inventory.model.js';
import ApiError from '../utils/ApiError.js';
import { withTransaction } from '../db/transactions.js';
import { createAuditLog } from './audit.service.js';
import { PAYMENT_STATUS, AUDIT_ACTION } from '../constants/platform.js';
import { ORDER_STATUS } from '../constants/orderStatus.js';

// ============== PAYMENT PROVIDERS ==============

/**
 * Payment provider interface
 * Implement this interface for each payment gateway
 */
const PaymentProviders = {
    /**
     * Mock payment provider for development/testing
     */
    MOCK: {
        name: 'MOCK',

        /**
         * Initiate a payment
         */
        async initiatePayment({ amount, currency, orderId, metadata }) {
            // Simulate payment processing delay
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Generate mock transaction reference
            const transactionReference = `MOCK_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            return {
                success: true,
                transactionReference,
                status: PAYMENT_STATUS.SUCCESS, // Mock always succeeds
                providerResponse: {
                    mockId: transactionReference,
                    timestamp: new Date().toISOString(),
                },
            };
        },

        /**
         * Process a refund
         */
        async processRefund({ transactionReference, amount, reason }) {
            // Simulate refund processing delay
            await new Promise((resolve) => setTimeout(resolve, 100));

            return {
                success: true,
                refundReference: `REFUND_${transactionReference}_${Date.now()}`,
                status: PAYMENT_STATUS.REFUNDED,
            };
        },

        /**
         * Verify payment status
         */
        async verifyPayment({ transactionReference }) {
            return {
                verified: true,
                status: PAYMENT_STATUS.SUCCESS,
            };
        },
    },

    // Add more providers here:
    // STRIPE: { ... },
    // RAZORPAY: { ... },
    // PAYPAL: { ... }
};

// Default payment provider
const DEFAULT_PROVIDER = 'MOCK';
const DEFAULT_CURRENCY = 'USD';

// ============== CORE PAYMENT FUNCTIONS ==============

/**
 * Initiate a payment for an order
 */
export const initiatePayment = async (
    orderId,
    userId,
    provider = DEFAULT_PROVIDER,
    ipAddress,
    userAgent
) => {
    // Get order
    const order = await Order.findById(orderId);

    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    // Verify order belongs to user
    if (order.userId.toString() !== userId.toString()) {
        throw new ApiError(403, 'Unauthorized access to order');
    }

    // Check if order is in valid state for payment
    if (order.status !== ORDER_STATUS.CREATED) {
        throw new ApiError(
            400,
            `Cannot pay for order with status: ${order.status}`
        );
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
        orderId,
        status: { $in: [PAYMENT_STATUS.INITIATED, PAYMENT_STATUS.SUCCESS] },
    });

    if (existingPayment) {
        if (existingPayment.status === PAYMENT_STATUS.SUCCESS) {
            throw new ApiError(400, 'Order is already paid');
        }
        // Return existing initiated payment
        return existingPayment;
    }

    // Get payment provider
    const paymentProvider = PaymentProviders[provider];
    if (!paymentProvider) {
        throw new ApiError(400, `Unsupported payment provider: ${provider}`);
    }

    return withTransaction(async (session) => {
        // Create payment record
        const payment = new Payment({
            orderId,
            userId,
            provider,
            amount: order.pricing.totalAmount,
            currency: DEFAULT_CURRENCY,
            status: PAYMENT_STATUS.INITIATED,
        });

        await payment.save({ session });

        // Log audit
        await createAuditLog({
            action: AUDIT_ACTION.PAYMENT_INITIATE,
            userId,
            targetType: 'Payment',
            targetId: payment._id,
            details: {
                orderId,
                amount: order.pricing.totalAmount,
                provider,
            },
            ipAddress,
            userAgent,
        });

        return payment;
    });
};

/**
 * Process payment (complete the payment flow)
 * Simplified mock implementation - always succeeds for development
 * TODO: Integrate Stripe or other payment provider for production
 */
export const processPayment = async (
    paymentId,
    userId,
    ipAddress,
    userAgent
) => {
    const payment = await Payment.findById(paymentId);

    if (!payment) {
        throw new ApiError(404, 'Payment not found');
    }

    if (payment.userId.toString() !== userId.toString()) {
        throw new ApiError(403, 'Unauthorized access to payment');
    }

    if (payment.status !== PAYMENT_STATUS.INITIATED) {
        throw new ApiError(
            400,
            `Cannot process payment with status: ${payment.status}`
        );
    }

    // Generate mock transaction reference
    const transactionReference = `MOCK_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Update payment to SUCCESS
    payment.status = PAYMENT_STATUS.SUCCESS;
    payment.transactionReference = transactionReference;
    payment.paidAt = new Date();
    await payment.save();

    // Update order status to PAID
    const order = await Order.findById(payment.orderId);
    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    if (order.status === ORDER_STATUS.CREATED) {
        order.status = ORDER_STATUS.PAID;
        order.paidAt = new Date();
        await order.save();

        // Record status change in history
        await OrderStatusHistory.create({
            orderId: order._id,
            status: ORDER_STATUS.PAID,
            changedBy: userId,
            actorRole: 'USER',
            changedAt: new Date(),
            notes: `Payment completed via ${payment.provider}`,
        });

        // Release reserved stock (confirm the reservation)
        for (const item of order.items) {
            await Inventory.findOneAndUpdate(
                { productId: item.productId },
                { $inc: { reservedStock: -item.quantity } }
            );
        }
    }

    // Log success
    await createAuditLog({
        action: AUDIT_ACTION.PAYMENT_SUCCESS,
        userId,
        targetType: 'Payment',
        targetId: payment._id,
        details: {
            orderId: payment.orderId,
            amount: payment.amount,
            transactionReference,
        },
        ipAddress,
        userAgent,
    });

    return {
        success: true,
        payment: {
            _id: payment._id,
            orderId: payment.orderId,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            transactionReference,
            paidAt: payment.paidAt,
        },
        order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
        },
        message: 'Payment successful! Order is now confirmed.',
    };
};

/**
 * Quick pay - initiate and process in one step (for mock/simple providers)
 */
export const quickPay = async (
    orderId,
    userId,
    provider = DEFAULT_PROVIDER,
    ipAddress,
    userAgent
) => {
    // Initiate payment
    const payment = await initiatePayment(
        orderId,
        userId,
        provider,
        ipAddress,
        userAgent
    );

    // Process payment
    return processPayment(payment._id, userId, ipAddress, userAgent);
};

/**
 * Process refund for a payment
 */
export const processRefund = async (
    paymentId,
    adminId,
    reason,
    ipAddress,
    userAgent
) => {
    const payment = await Payment.findById(paymentId).populate('orderId');

    if (!payment) {
        throw new ApiError(404, 'Payment not found');
    }

    if (payment.status !== PAYMENT_STATUS.SUCCESS) {
        throw new ApiError(400, 'Can only refund successful payments');
    }

    // Get payment provider
    const paymentProvider = PaymentProviders[payment.provider];
    if (!paymentProvider) {
        throw new ApiError(
            500,
            `Payment provider not found: ${payment.provider}`
        );
    }

    return withTransaction(async (session) => {
        // Process refund with provider
        const result = await paymentProvider.processRefund({
            transactionReference: payment.transactionReference,
            amount: payment.amount,
            reason,
        });

        if (result.success) {
            // Update payment status
            payment.status = PAYMENT_STATUS.REFUNDED;
            await payment.save({ session });

            // Log refund
            await createAuditLog({
                action: AUDIT_ACTION.PAYMENT_REFUND,
                userId: adminId,
                targetType: 'Payment',
                targetId: payment._id,
                details: {
                    orderId: payment.orderId._id,
                    amount: payment.amount,
                    reason,
                    refundReference: result.refundReference,
                },
                ipAddress,
                userAgent,
            });

            return {
                success: true,
                payment,
                refundReference: result.refundReference,
            };
        } else {
            throw new ApiError(500, 'Refund processing failed');
        }
    });
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (paymentId, userId, isAdmin = false) => {
    const payment = await Payment.findById(paymentId)
        .populate('orderId', 'orderNumber status pricing.totalAmount')
        .populate('userId', 'email');

    if (!payment) {
        throw new ApiError(404, 'Payment not found');
    }

    // Check access
    if (!isAdmin && payment.userId._id.toString() !== userId.toString()) {
        throw new ApiError(403, 'Unauthorized access to payment');
    }

    return payment;
};

/**
 * Get payments for a user
 */
export const getUserPayments = async (userId, options = {}) => {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;

    const query = { userId };

    if (status) {
        query.status = status;
    }

    const [payments, total] = await Promise.all([
        Payment.find(query)
            .populate('orderId', 'orderNumber status pricing.totalAmount')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Payment.countDocuments(query),
    ]);

    return {
        payments,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get payments for an order
 */
export const getOrderPayments = async (orderId) => {
    return Payment.find({ orderId }).sort({ createdAt: -1 }).lean();
};

/**
 * Get payment statistics (admin)
 */
export const getPaymentStats = async (startDate, endDate) => {
    const matchStage = {};

    if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const stats = await Payment.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
            },
        },
    ]);

    // Format stats
    const formatted = {
        total: 0,
        totalAmount: 0,
        byStatus: {},
    };

    stats.forEach((stat) => {
        formatted.byStatus[stat._id] = {
            count: stat.count,
            amount: stat.totalAmount,
        };
        formatted.total += stat.count;
        if (stat._id === PAYMENT_STATUS.SUCCESS) {
            formatted.totalAmount += stat.totalAmount;
        }
    });

    return formatted;
};

/**
 * Verify payment with provider (for webhook validation)
 */
export const verifyPayment = async (paymentId) => {
    const payment = await Payment.findById(paymentId);

    if (!payment) {
        throw new ApiError(404, 'Payment not found');
    }

    const paymentProvider = PaymentProviders[payment.provider];
    if (!paymentProvider) {
        throw new ApiError(
            500,
            `Payment provider not found: ${payment.provider}`
        );
    }

    const result = await paymentProvider.verifyPayment({
        transactionReference: payment.transactionReference,
    });

    return {
        payment,
        verified: result.verified,
        providerStatus: result.status,
    };
};

export default {
    initiatePayment,
    processPayment,
    quickPay,
    processRefund,
    getPaymentById,
    getUserPayments,
    getOrderPayments,
    getPaymentStats,
    verifyPayment,
};
