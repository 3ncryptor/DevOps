import { ApiError } from '../utils/ApiError.js';
import ROLES from '../constants/roles.js';
import { Store } from '../models/store.model.js';
import { Product } from '../models/product.model.js';
import { Order } from '../models/order.model.js';
import { Seller } from '../models/seller.model.js';

/**
 * Generic ownership checker factory
 * Creates middleware that checks if the current user owns a resource
 *
 * @param {Object} options
 * @param {Model} options.model - Mongoose model to query
 * @param {string} options.paramName - Request param containing resource ID (default: 'id')
 * @param {string} options.ownerField - Field in model containing owner ID (default: 'userId')
 * @param {boolean} options.allowAdmin - Allow admin to bypass check (default: true)
 * @param {string} options.resourceName - Human-readable name for error messages
 */
const checkOwnership = ({
    model,
    paramName = 'id',
    ownerField = 'userId',
    allowAdmin = true,
    resourceName = 'Resource',
}) => {
    return async (req, _, next) => {
        if (!req.user) {
            throw new ApiError(401, 'Authentication required');
        }

        // Admin bypass
        if (allowAdmin && req.user.role === ROLES.SUPER_ADMIN) {
            return next();
        }

        const resourceId = req.params[paramName];
        if (!resourceId) {
            throw new ApiError(400, `${resourceName} ID is required`);
        }

        const resource = await model.findById(resourceId);
        if (!resource) {
            throw new ApiError(404, `${resourceName} not found`);
        }

        // Check ownership - handle both string and ObjectId
        const ownerId = resource[ownerField]?.toString();
        const userId = req.user.id?.toString();

        if (ownerId !== userId) {
            throw new ApiError(
                403,
                `You don't have permission to access this ${resourceName.toLowerCase()}`
            );
        }

        // Attach resource to request for later use
        req.resource = resource;
        next();
    };
};

/**
 * Check if user owns the seller profile
 * Attaches seller to req.seller if found
 */
const checkSellerOwnership = async (req, _, next) => {
    if (!req.user) {
        throw new ApiError(401, 'Authentication required');
    }

    // Admin bypass
    if (req.user.role === ROLES.SUPER_ADMIN) {
        if (req.params.sellerId) {
            const seller = await Seller.findById(req.params.sellerId);
            if (!seller) {
                throw new ApiError(404, 'Seller not found');
            }
            req.seller = seller;
        }
        return next();
    }

    // For sellers, find their seller profile
    const seller = await Seller.findOne({ userId: req.user.id });
    if (!seller) {
        throw new ApiError(
            403,
            'Seller profile not found. Please complete seller registration.'
        );
    }

    // If accessing a specific seller, verify it's their own
    if (req.params.sellerId && req.params.sellerId !== seller._id.toString()) {
        throw new ApiError(403, 'You can only access your own seller profile');
    }

    req.seller = seller;
    next();
};

/**
 * Check if user owns the store (through their seller profile)
 * Attaches store to req.store if found
 */
const checkStoreOwnership = async (req, _, next) => {
    if (!req.user) {
        throw new ApiError(401, 'Authentication required');
    }

    // Admin bypass
    if (req.user.role === ROLES.SUPER_ADMIN) {
        if (req.params.storeId) {
            const store = await Store.findById(req.params.storeId).populate(
                'sellerId'
            );
            if (!store) {
                throw new ApiError(404, 'Store not found');
            }
            req.store = store;
            req.seller = store.sellerId;
        }
        return next();
    }

    // Get seller profile first
    const seller = await Seller.findOne({ userId: req.user.id });
    if (!seller) {
        throw new ApiError(403, 'Seller profile not found');
    }

    const storeId = req.params.storeId;
    if (!storeId) {
        // If no storeId, just attach seller and continue
        req.seller = seller;
        return next();
    }

    const store = await Store.findById(storeId);
    if (!store) {
        throw new ApiError(404, 'Store not found');
    }

    // Check if this store belongs to the seller
    if (store.sellerId.toString() !== seller._id.toString()) {
        throw new ApiError(
            403,
            "You don't have permission to access this store"
        );
    }

    req.store = store;
    req.seller = seller;
    next();
};

/**
 * Check if user owns the product (through their store)
 * Attaches product to req.product if found
 */
const checkProductOwnership = async (req, _, next) => {
    if (!req.user) {
        throw new ApiError(401, 'Authentication required');
    }

    // Admin bypass
    if (req.user.role === ROLES.SUPER_ADMIN) {
        if (req.params.productId) {
            const product = await Product.findById(
                req.params.productId
            ).populate({
                path: 'storeId',
                populate: { path: 'sellerId' },
            });
            if (!product) {
                throw new ApiError(404, 'Product not found');
            }
            req.product = product;
            req.store = product.storeId;
        }
        return next();
    }

    // Get seller profile
    const seller = await Seller.findOne({ userId: req.user.id });
    if (!seller) {
        throw new ApiError(403, 'Seller profile not found');
    }

    const productId = req.params.productId;
    if (!productId) {
        req.seller = seller;
        return next();
    }

    const product = await Product.findById(productId).populate('storeId');
    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    // Check if the product's store belongs to this seller
    if (product.storeId.sellerId.toString() !== seller._id.toString()) {
        throw new ApiError(
            403,
            "You don't have permission to access this product"
        );
    }

    req.product = product;
    req.store = product.storeId;
    req.seller = seller;
    next();
};

/**
 * Check order access - buyer can see their orders, seller can see orders for their store
 * Attaches order to req.order if found
 */
const checkOrderAccess = async (req, _, next) => {
    if (!req.user) {
        throw new ApiError(401, 'Authentication required');
    }

    const orderId = req.params.orderId;
    if (!orderId) {
        throw new ApiError(400, 'Order ID is required');
    }

    const order = await Order.findById(orderId).populate('storeId');
    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    // Admin can access all orders
    if (req.user.role === ROLES.SUPER_ADMIN) {
        req.order = order;
        return next();
    }

    // Buyer can access their own orders
    if (order.userId.toString() === req.user.id) {
        req.order = order;
        req.orderRole = 'buyer';
        return next();
    }

    // Seller can access orders for their store
    if (req.user.role === ROLES.SELLER) {
        const seller = await Seller.findOne({ userId: req.user.id });
        if (
            seller &&
            order.storeId.sellerId.toString() === seller._id.toString()
        ) {
            req.order = order;
            req.seller = seller;
            req.orderRole = 'seller';
            return next();
        }
    }

    throw new ApiError(403, "You don't have permission to access this order");
};

/**
 * Attach seller to request if user is a seller
 * Does not block request if seller not found (useful for conditional checks)
 */
const attachSeller = async (req, _, next) => {
    if (req.user && req.user.role === ROLES.SELLER) {
        const seller = await Seller.findOne({ userId: req.user.id });
        if (seller) {
            req.seller = seller;
        }
    }
    next();
};

/**
 * Require seller to be approved
 */
const requireApprovedSeller = async (req, _, next) => {
    if (!req.user) {
        throw new ApiError(401, 'Authentication required');
    }

    // Admin bypass
    if (req.user.role === ROLES.SUPER_ADMIN) {
        return next();
    }

    if (req.user.role !== ROLES.SELLER) {
        throw new ApiError(403, 'This action requires a seller account');
    }

    // Check if seller profile exists and is approved
    const seller = await Seller.findOne({ userId: req.user.id });
    if (!seller) {
        throw new ApiError(
            403,
            'Seller profile not found. Please complete registration.'
        );
    }

    if (seller.status !== 'APPROVED') {
        throw new ApiError(
            403,
            'Your seller account is pending approval or has been suspended'
        );
    }

    req.seller = seller;
    next();
};

export {
    checkOwnership,
    checkSellerOwnership,
    checkStoreOwnership,
    checkProductOwnership,
    checkOrderAccess,
    attachSeller,
    requireApprovedSeller,
};
