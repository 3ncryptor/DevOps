import { Store } from '../models/store.model.js';
import { StoreSettings } from '../models/storeSettings.model.js';
import { Seller } from '../models/seller.model.js';
import { Product } from '../models/product.model.js';
import { ApiError } from '../utils/ApiError.js';
import { createAuditLog } from './audit.service.js';
import { withTransaction } from '../db/transactions.js';
import {
    STORE_STATUS,
    SELLER_STATUS,
    AUDIT_ACTION,
    PAGINATION,
} from '../constants/index.js';

/**
 * Generate URL-friendly slug from name
 */
const generateSlug = (name) => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

/**
 * Ensure unique slug
 */
const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const query = { 'storeIdentity.slug': slug };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        const existing = await Store.findOne(query);
        if (!existing) {
            return slug;
        }

        slug = `${baseSlug}-${counter}`;
        counter++;

        if (counter > 100) {
            throw new ApiError(500, 'Unable to generate unique slug');
        }
    }
};

/**
 * Create a new store
 */
const createStore = async (
    sellerId,
    storeData,
    ipAddress = null,
    userAgent = null
) => {
    const { name, description, location } = storeData;

    if (!name) {
        throw new ApiError(400, 'Store name is required');
    }

    // Verify seller exists and is approved
    const seller = await Seller.findById(sellerId);
    if (!seller) {
        throw new ApiError(404, 'Seller not found');
    }

    if (seller.status !== SELLER_STATUS.APPROVED) {
        throw new ApiError(403, 'Only approved sellers can create stores');
    }

    // Generate unique slug
    const baseSlug = generateSlug(name);
    const slug = await ensureUniqueSlug(baseSlug);

    const result = await withTransaction(async (session) => {
        // Create store
        const [store] = await Store.create(
            [
                {
                    sellerId,
                    storeIdentity: {
                        name: name.trim(),
                        slug,
                    },
                    description: description?.trim(),
                    location: location
                        ? {
                              addressLine1: location.addressLine1?.trim(),
                              city: location.city?.trim(),
                              state: location.state?.trim(),
                              postalCode: location.postalCode?.trim(),
                              country: location.country?.trim(),
                          }
                        : undefined,
                    storeStatus: STORE_STATUS.ACTIVE,
                },
            ],
            { session }
        );

        // Create default store settings
        await StoreSettings.create(
            [
                {
                    storeId: store._id,
                    orderSettings: {
                        minOrderValue: 0,
                        maxOrderValue: 100000,
                    },
                    shippingSettings: {
                        freeShippingThreshold: 0,
                    },
                },
            ],
            { session }
        );

        return store;
    });

    // Log store creation
    await createAuditLog({
        action: AUDIT_ACTION.STORE_CREATE,
        userId: seller.userId,
        targetType: 'Store',
        targetId: result._id,
        details: { storeName: name },
        ipAddress,
        userAgent,
        sellerId,
        storeId: result._id,
    });

    return result;
};

/**
 * Get store by ID
 */
const getStoreById = async (storeId) => {
    const store = await Store.findById(storeId).populate(
        'sellerId',
        'business.displayName status'
    );

    if (!store) {
        throw new ApiError(404, 'Store not found');
    }

    return store;
};

/**
 * Get store by slug (public)
 */
const getStoreBySlug = async (slug) => {
    const store = await Store.findOne({ 'storeIdentity.slug': slug }).populate(
        'sellerId',
        'business.displayName'
    );

    if (!store) {
        throw new ApiError(404, 'Store not found');
    }

    if (store.storeStatus !== STORE_STATUS.ACTIVE) {
        throw new ApiError(403, 'This store is not available');
    }

    return store;
};

/**
 * Get stores by seller
 */
const getStoresBySeller = async (sellerId) => {
    const stores = await Store.find({ sellerId })
        .sort({ createdAt: -1 })
        .lean();

    return stores;
};

/**
 * Update store
 */
const updateStore = async (
    storeId,
    sellerId,
    updateData,
    ipAddress = null,
    userAgent = null
) => {
    const store = await Store.findById(storeId);
    if (!store) {
        throw new ApiError(404, 'Store not found');
    }

    // Verify ownership
    if (store.sellerId.toString() !== sellerId.toString()) {
        throw new ApiError(
            403,
            "You don't have permission to update this store"
        );
    }

    const previousState = store.toObject();
    const updates = {};

    // Allowed updates
    if (updateData.name) {
        updates['storeIdentity.name'] = updateData.name.trim();
        // Update slug if name changes
        const baseSlug = generateSlug(updateData.name);
        updates['storeIdentity.slug'] = await ensureUniqueSlug(
            baseSlug,
            storeId
        );
    }

    if (updateData.description !== undefined) {
        updates.description = updateData.description?.trim();
    }

    if (updateData.branding) {
        if (updateData.branding.logoUrl !== undefined) {
            updates['branding.logoUrl'] = updateData.branding.logoUrl;
        }
        if (updateData.branding.bannerUrl !== undefined) {
            updates['branding.bannerUrl'] = updateData.branding.bannerUrl;
        }
    }

    if (updateData.location) {
        Object.keys(updateData.location).forEach((key) => {
            if (updateData.location[key] !== undefined) {
                updates[`location.${key}`] = updateData.location[key]?.trim();
            }
        });
    }

    if (Object.keys(updates).length === 0) {
        throw new ApiError(400, 'No valid fields to update');
    }

    const updatedStore = await Store.findByIdAndUpdate(
        storeId,
        { $set: updates },
        { new: true }
    );

    // Get seller for audit log
    const seller = await Seller.findById(sellerId);

    // Log update
    await createAuditLog({
        action: AUDIT_ACTION.STORE_UPDATE,
        userId: seller?.userId,
        targetType: 'Store',
        targetId: storeId,
        previousState,
        newState: updatedStore.toObject(),
        ipAddress,
        userAgent,
        sellerId,
        storeId,
    });

    return updatedStore;
};

/**
 * List stores (public with pagination)
 */
const listStores = async ({
    search,
    city,
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
}) => {
    const query = { storeStatus: STORE_STATUS.ACTIVE };

    if (search) {
        query.$or = [
            { 'storeIdentity.name': { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
        ];
    }

    if (city) {
        query['location.city'] = { $regex: city, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

    const [stores, total] = await Promise.all([
        Store.find(query)
            .populate('sellerId', 'business.displayName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .lean(),
        Store.countDocuments(query),
    ]);

    return {
        stores,
        pagination: {
            page,
            limit: safeLimit,
            total,
            pages: Math.ceil(total / safeLimit),
        },
    };
};

// ============== ADMIN FUNCTIONS ==============

/**
 * Suspend store (Admin)
 */
const suspendStore = async (
    storeId,
    adminId,
    reason,
    ipAddress = null,
    userAgent = null
) => {
    if (!reason) {
        throw new ApiError(400, 'Suspension reason is required');
    }

    const store = await Store.findById(storeId);
    if (!store) {
        throw new ApiError(404, 'Store not found');
    }

    if (store.storeStatus === STORE_STATUS.SUSPENDED) {
        throw new ApiError(400, 'Store is already suspended');
    }

    const previousState = store.toObject();

    store.storeStatus = STORE_STATUS.SUSPENDED;
    await store.save();

    // Log suspension
    await createAuditLog({
        action: AUDIT_ACTION.STORE_SUSPEND,
        userId: adminId,
        targetType: 'Store',
        targetId: storeId,
        previousState,
        newState: store.toObject(),
        details: { reason },
        ipAddress,
        userAgent,
        sellerId: store.sellerId,
        storeId,
    });

    return store;
};

/**
 * Reactivate store (Admin)
 */
const reactivateStore = async (
    storeId,
    adminId,
    ipAddress = null,
    userAgent = null
) => {
    const store = await Store.findById(storeId);
    if (!store) {
        throw new ApiError(404, 'Store not found');
    }

    if (store.storeStatus !== STORE_STATUS.SUSPENDED) {
        throw new ApiError(400, 'Store is not suspended');
    }

    // Verify seller is still approved
    const seller = await Seller.findById(store.sellerId);
    if (!seller || seller.status !== SELLER_STATUS.APPROVED) {
        throw new ApiError(
            400,
            'Cannot reactivate store - seller is not approved'
        );
    }

    const previousState = store.toObject();

    store.storeStatus = STORE_STATUS.ACTIVE;
    await store.save();

    // Log reactivation
    await createAuditLog({
        action: AUDIT_ACTION.STORE_ACTIVATE,
        userId: adminId,
        targetType: 'Store',
        targetId: storeId,
        previousState,
        newState: store.toObject(),
        ipAddress,
        userAgent,
        sellerId: store.sellerId,
        storeId,
    });

    return store;
};

/**
 * Close store (Seller)
 */
const closeStore = async (
    storeId,
    sellerId,
    ipAddress = null,
    userAgent = null
) => {
    const store = await Store.findById(storeId);
    if (!store) {
        throw new ApiError(404, 'Store not found');
    }

    if (store.sellerId.toString() !== sellerId.toString()) {
        throw new ApiError(
            403,
            "You don't have permission to close this store"
        );
    }

    // Check for pending orders (would need order service)
    // For now, just close the store

    const previousState = store.toObject();

    store.storeStatus = STORE_STATUS.CLOSED;
    await store.save();

    // Archive all products
    await Product.updateMany(
        { storeId, status: 'PUBLISHED' },
        { status: 'ARCHIVED' }
    );

    const seller = await Seller.findById(sellerId);

    // Log closure
    await createAuditLog({
        action: AUDIT_ACTION.STORE_CLOSE,
        userId: seller?.userId,
        targetType: 'Store',
        targetId: storeId,
        previousState,
        newState: store.toObject(),
        ipAddress,
        userAgent,
        sellerId,
        storeId,
    });

    return store;
};

/**
 * Get store with product count
 */
const getStoreWithStats = async (storeId) => {
    const store = await Store.findById(storeId).populate(
        'sellerId',
        'business.displayName status'
    );

    if (!store) {
        throw new ApiError(404, 'Store not found');
    }

    const productCount = await Product.countDocuments({
        storeId,
        status: 'PUBLISHED',
    });

    return {
        ...store.toObject(),
        productCount,
    };
};

export {
    createStore,
    getStoreById,
    getStoreBySlug,
    getStoresBySeller,
    updateStore,
    listStores,
    suspendStore,
    reactivateStore,
    closeStore,
    getStoreWithStats,
    generateSlug,
    ensureUniqueSlug,
};
