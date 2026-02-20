import { AuditLog } from '../models/auditLog.model.js';
import { PAGINATION } from '../constants/index.js';
import { logger } from '../config/logger.config.js';

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @param {string} params.action - The action type (from AUDIT_ACTION)
 * @param {string} params.userId - ID of user performing action
 * @param {string} params.userRole - Role of user performing action
 * @param {string} params.targetType - Type of entity affected (User, Seller, Store, etc.)
 * @param {string} params.targetId - ID of entity affected
 * @param {Object} params.previousState - Previous state (for updates)
 * @param {Object} params.newState - New state (for updates)
 * @param {Object} params.details - Additional details
 * @param {string} params.ipAddress - Client IP address
 * @param {string} params.userAgent - Client user agent
 * @param {string} params.sellerId - Seller ID (for seller-related actions)
 * @param {string} params.storeId - Store ID (for store-related actions)
 */
const createAuditLog = async ({
    action,
    userId,
    userRole,
    targetType,
    targetId,
    previousState,
    newState,
    details,
    ipAddress,
    userAgent,
    sellerId,
    storeId,
}) => {
    try {
        // Create audit log asynchronously (fire and forget for performance)
        // Errors are caught to prevent affecting main request
        await AuditLog.create({
            action,
            userId,
            userRole,
            targetType,
            targetId,
            previousState,
            newState,
            details,
            ipAddress,
            userAgent,
            sellerId,
            storeId,
        });
    } catch (error) {
        // Log error but don't throw - audit logging should not break main flow
        logger.error('Audit log creation failed', {
            error: error.message,
            action,
            targetType,
            targetId,
        });
    }
};

/**
 * Get audit logs with pagination and filtering
 */
const getAuditLogs = async ({
    userId,
    action,
    targetType,
    targetId,
    sellerId,
    storeId,
    startDate,
    endDate,
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
}) => {
    const query = {};

    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (targetType) query.targetType = targetType;
    if (targetId) query.targetId = targetId;
    if (sellerId) query.sellerId = sellerId;
    if (storeId) query.storeId = storeId;

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

    const [logs, total] = await Promise.all([
        AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .populate('userId', 'email role')
            .lean(),
        AuditLog.countDocuments(query),
    ]);

    return {
        logs,
        pagination: {
            page,
            limit: safeLimit,
            total,
            pages: Math.ceil(total / safeLimit),
        },
    };
};

/**
 * Get audit logs for a specific entity
 */
const getEntityAuditLogs = async (
    targetType,
    targetId,
    page = 1,
    limit = 20
) => {
    return getAuditLogs({
        targetType,
        targetId,
        page,
        limit,
    });
};

/**
 * Get audit logs for a user
 */
const getUserAuditLogs = async (userId, page = 1, limit = 20) => {
    return getAuditLogs({
        userId,
        page,
        limit,
    });
};

/**
 * Delete old audit logs (for cleanup job)
 * @param {number} daysToKeep - Number of days of logs to retain
 */
const deleteOldAuditLogs = async (daysToKeep = 90) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await AuditLog.deleteMany({
        createdAt: { $lt: cutoffDate },
    });

    return result.deletedCount;
};

export {
    createAuditLog,
    getAuditLogs,
    getEntityAuditLogs,
    getUserAuditLogs,
    deleteOldAuditLogs,
};
