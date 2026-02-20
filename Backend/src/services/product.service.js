import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';
import { ProductPrice } from '../models/productPrice.model.js';
import { ProductImage } from '../models/productImage.model.js';
import { Inventory } from '../models/inventory.model.js';
import { Store } from '../models/store.model.js';
import { Category } from '../models/category.model.js';
import { ApiError } from '../utils/ApiError.js';
import { createAuditLog } from './audit.service.js';
import { withTransaction } from '../db/transactions.js';
import {
    PRODUCT_STATUS,
    STORE_STATUS,
    AUDIT_ACTION,
    PAGINATION,
} from '../constants/index.js';

/**
 * Create a new product
 */
const createProduct = async (
    sellerId,
    storeId,
    productData,
    ipAddress = null,
    userAgent = null
) => {
    const {
        identity,
        categoryId,
        attributes,
        price,
        images,
        initialStock = 0,
    } = productData;

    // Validate required fields
    if (!identity?.title || !identity?.description) {
        throw new ApiError(400, 'Product title and description are required');
    }

    if (!categoryId) {
        throw new ApiError(400, 'Category is required');
    }

    if (!price || price <= 0) {
        throw new ApiError(400, 'Valid price is required');
    }

    // Verify store exists and belongs to seller
    const store = await Store.findById(storeId);
    if (!store) {
        throw new ApiError(404, 'Store not found');
    }

    if (store.sellerId.toString() !== sellerId.toString()) {
        throw new ApiError(
            403,
            "You don't have permission to add products to this store"
        );
    }

    if (store.storeStatus !== STORE_STATUS.ACTIVE) {
        throw new ApiError(400, 'Cannot add products to an inactive store');
    }

    // Verify category exists
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiError(404, 'Category not found');
    }

    const result = await withTransaction(async (session) => {
        // Create product
        const [product] = await Product.create(
            [
                {
                    storeId,
                    categoryId,
                    identity: {
                        title: identity.title.trim(),
                        subtitle: identity.subtitle?.trim(),
                        description: identity.description.trim(),
                    },
                    attributes: attributes
                        ? {
                              brand: attributes.brand?.trim(),
                              sku: attributes.sku?.trim(),
                              weight: attributes.weight,
                              dimensions: attributes.dimensions,
                          }
                        : undefined,
                    status: PRODUCT_STATUS.DRAFT,
                },
            ],
            { session }
        );

        // Create price record
        await ProductPrice.create(
            [
                {
                    productId: product._id,
                    price,
                    currency: productData.currency || 'USD',
                    effectiveFrom: new Date(),
                },
            ],
            { session }
        );

        // Create inventory record
        await Inventory.create(
            [
                {
                    productId: product._id,
                    storeId,
                    availableStock: initialStock,
                    reservedStock: 0,
                    reorderThreshold: productData.reorderThreshold || 10,
                },
            ],
            { session }
        );

        // Create image records if provided
        if (images && images.length > 0) {
            const imageRecords = images.map((img, index) => ({
                productId: product._id,
                url: img.url,
                altText: img.altText,
                sortOrder: img.sortOrder ?? index,
            }));
            await ProductImage.insertMany(imageRecords, { session });
        }

        return product;
    });

    // Log product creation
    await createAuditLog({
        action: AUDIT_ACTION.PRODUCT_CREATE,
        userId: store.sellerId,
        targetType: 'Product',
        targetId: result._id,
        details: { title: identity.title },
        ipAddress,
        userAgent,
        sellerId,
        storeId,
    });

    // Return with full details
    return getProductWithDetails(result._id);
};

/**
 * Get product by ID with all related data
 */
const getProductWithDetails = async (productId) => {
    const product = await Product.findById(productId)
        .populate(
            'storeId',
            'storeIdentity.name storeIdentity.slug storeStatus'
        )
        .populate('categoryId', 'name slug');

    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    // Get current price
    const price = await ProductPrice.findOne({
        productId,
        effectiveFrom: { $lte: new Date() },
        $or: [{ effectiveTo: null }, { effectiveTo: { $gte: new Date() } }],
    }).sort({ effectiveFrom: -1 });

    // Get images
    const images = await ProductImage.find({ productId }).sort({
        sortOrder: 1,
    });

    // Get inventory
    const inventory = await Inventory.findOne({ productId });

    return {
        ...product.toObject(),
        currentPrice: price,
        images,
        inventory: inventory
            ? {
                  availableStock: inventory.availableStock,
                  reservedStock: inventory.reservedStock,
                  inStock: inventory.availableStock > 0,
              }
            : null,
    };
};

/**
 * Get product by ID (public - only published)
 */
const getPublishedProduct = async (productId) => {
    const product = await getProductWithDetails(productId);

    if (product.status !== PRODUCT_STATUS.PUBLISHED) {
        throw new ApiError(404, 'Product not found');
    }

    if (product.storeId.storeStatus !== STORE_STATUS.ACTIVE) {
        throw new ApiError(404, 'Product not available');
    }

    return product;
};

/**
 * Update product
 */
const updateProduct = async (
    productId,
    sellerId,
    updateData,
    ipAddress = null,
    userAgent = null
) => {
    const product = await Product.findById(productId).populate('storeId');
    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    // Verify ownership through store
    if (product.storeId.sellerId.toString() !== sellerId.toString()) {
        throw new ApiError(
            403,
            "You don't have permission to update this product"
        );
    }

    const previousState = await getProductWithDetails(productId);
    const updates = {};

    // Update identity
    if (updateData.identity) {
        if (updateData.identity.title) {
            updates['identity.title'] = updateData.identity.title.trim();
        }
        if (updateData.identity.subtitle !== undefined) {
            updates['identity.subtitle'] = updateData.identity.subtitle?.trim();
        }
        if (updateData.identity.description) {
            updates['identity.description'] =
                updateData.identity.description.trim();
        }
    }

    // Update attributes
    if (updateData.attributes) {
        Object.keys(updateData.attributes).forEach((key) => {
            if (updateData.attributes[key] !== undefined) {
                updates[`attributes.${key}`] = updateData.attributes[key];
            }
        });
    }

    // Update category
    if (updateData.categoryId) {
        const category = await Category.findById(updateData.categoryId);
        if (!category) {
            throw new ApiError(404, 'Category not found');
        }
        updates.categoryId = updateData.categoryId;
    }

    // Update price (creates new price record)
    if (updateData.price && updateData.price > 0) {
        // Expire current price
        await ProductPrice.updateMany(
            { productId, effectiveTo: null },
            { effectiveTo: new Date() }
        );

        // Create new price record
        await ProductPrice.create({
            productId,
            price: updateData.price,
            currency: updateData.currency || 'USD',
            effectiveFrom: new Date(),
        });
    }

    // Apply product updates
    if (Object.keys(updates).length > 0) {
        await Product.findByIdAndUpdate(productId, { $set: updates });
    }

    const updatedProduct = await getProductWithDetails(productId);

    // Log update
    await createAuditLog({
        action: AUDIT_ACTION.PRODUCT_UPDATE,
        userId: product.storeId.sellerId,
        targetType: 'Product',
        targetId: productId,
        previousState,
        newState: updatedProduct,
        ipAddress,
        userAgent,
        sellerId,
        storeId: product.storeId._id,
    });

    return updatedProduct;
};

/**
 * Publish product
 */
const publishProduct = async (
    productId,
    sellerId,
    ipAddress = null,
    userAgent = null
) => {
    const product = await Product.findById(productId).populate('storeId');
    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    if (product.storeId.sellerId.toString() !== sellerId.toString()) {
        throw new ApiError(
            403,
            "You don't have permission to publish this product"
        );
    }

    if (product.status === PRODUCT_STATUS.PUBLISHED) {
        throw new ApiError(400, 'Product is already published');
    }

    // Verify product has required data
    const price = await ProductPrice.findOne({ productId, effectiveTo: null });
    if (!price) {
        throw new ApiError(400, 'Product must have a price before publishing');
    }

    const previousState = product.toObject();

    product.status = PRODUCT_STATUS.PUBLISHED;
    await product.save();

    // Log publish
    await createAuditLog({
        action: AUDIT_ACTION.PRODUCT_PUBLISH,
        userId: product.storeId.sellerId,
        targetType: 'Product',
        targetId: productId,
        previousState,
        newState: product.toObject(),
        ipAddress,
        userAgent,
        sellerId,
        storeId: product.storeId._id,
    });

    return getProductWithDetails(productId);
};

/**
 * Archive product
 */
const archiveProduct = async (
    productId,
    sellerId,
    ipAddress = null,
    userAgent = null
) => {
    const product = await Product.findById(productId).populate('storeId');
    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    if (product.storeId.sellerId.toString() !== sellerId.toString()) {
        throw new ApiError(
            403,
            "You don't have permission to archive this product"
        );
    }

    if (product.status === PRODUCT_STATUS.ARCHIVED) {
        throw new ApiError(400, 'Product is already archived');
    }

    const previousState = product.toObject();

    product.status = PRODUCT_STATUS.ARCHIVED;
    await product.save();

    // Log archive
    await createAuditLog({
        action: AUDIT_ACTION.PRODUCT_ARCHIVE,
        userId: product.storeId.sellerId,
        targetType: 'Product',
        targetId: productId,
        previousState,
        newState: product.toObject(),
        ipAddress,
        userAgent,
        sellerId,
        storeId: product.storeId._id,
    });

    return product;
};

/**
 * Delete product (soft delete by archiving)
 */
const deleteProduct = async (
    productId,
    sellerId,
    ipAddress = null,
    userAgent = null
) => {
    // For safety, just archive the product
    return archiveProduct(productId, sellerId, ipAddress, userAgent);
};

/**
 * List products by store
 */
const getProductsByStore = async (storeId, options = {}) => {
    const {
        status,
        categoryId,
        search,
        minPrice,
        maxPrice,
        inStock,
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        sort = '-createdAt',
    } = options;

    const query = { storeId };

    // For public: only show published products
    if (status) {
        query.status = status;
    }

    if (categoryId) {
        query.categoryId = categoryId;
    }

    if (search) {
        query.$or = [
            { 'identity.title': { $regex: search, $options: 'i' } },
            { 'identity.description': { $regex: search, $options: 'i' } },
            { 'attributes.brand': { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (page - 1) * limit;
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

    // Build sort object
    const sortObj = {};
    if (sort.startsWith('-')) {
        sortObj[sort.slice(1)] = -1;
    } else {
        sortObj[sort] = 1;
    }

    const [products, total] = await Promise.all([
        Product.find(query)
            .populate('categoryId', 'name slug')
            .sort(sortObj)
            .skip(skip)
            .limit(safeLimit)
            .lean(),
        Product.countDocuments(query),
    ]);

    // Get prices and inventory for products
    const productIds = products.map((p) => p._id);

    const [prices, inventories] = await Promise.all([
        ProductPrice.find({
            productId: { $in: productIds },
            effectiveFrom: { $lte: new Date() },
            $or: [{ effectiveTo: null }, { effectiveTo: { $gte: new Date() } }],
        }).lean(),
        Inventory.find({ productId: { $in: productIds } }).lean(),
    ]);

    // Map prices and inventory to products
    const priceMap = new Map();
    prices.forEach((p) => {
        if (
            !priceMap.has(p.productId.toString()) ||
            p.effectiveFrom > priceMap.get(p.productId.toString()).effectiveFrom
        ) {
            priceMap.set(p.productId.toString(), p);
        }
    });

    const inventoryMap = new Map();
    inventories.forEach((i) => inventoryMap.set(i.productId.toString(), i));

    const enrichedProducts = products.map((product) => ({
        ...product,
        currentPrice: priceMap.get(product._id.toString()) || null,
        inventory: inventoryMap.get(product._id.toString()) || null,
    }));

    // Filter by price if needed
    let filteredProducts = enrichedProducts;
    if (minPrice !== undefined || maxPrice !== undefined) {
        filteredProducts = enrichedProducts.filter((p) => {
            if (!p.currentPrice) return false;
            if (minPrice !== undefined && p.currentPrice.price < minPrice)
                return false;
            if (maxPrice !== undefined && p.currentPrice.price > maxPrice)
                return false;
            return true;
        });
    }

    // Filter by stock if needed
    if (inStock !== undefined) {
        filteredProducts = filteredProducts.filter((p) => {
            if (!p.inventory) return false;
            return inStock
                ? p.inventory.availableStock > 0
                : p.inventory.availableStock === 0;
        });
    }

    return {
        products: filteredProducts,
        pagination: {
            page,
            limit: safeLimit,
            total,
            pages: Math.ceil(total / safeLimit),
        },
    };
};

/**
 * Search products (public)
 */
const searchProducts = async (options = {}) => {
    const {
        search,
        categoryId,
        storeId,
        minPrice,
        maxPrice,
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        sort = '-createdAt',
    } = options;

    const query = { status: PRODUCT_STATUS.PUBLISHED };

    if (search) {
        query.$or = [
            { 'identity.title': { $regex: search, $options: 'i' } },
            { 'identity.description': { $regex: search, $options: 'i' } },
            { 'attributes.brand': { $regex: search, $options: 'i' } },
        ];
    }

    if (categoryId) {
        query.categoryId = categoryId;
    }

    if (storeId) {
        query.storeId = storeId;
    } else {
        // Get only products from active stores
        const activeStores = await Store.find({
            storeStatus: STORE_STATUS.ACTIVE,
        }).select('_id');
        const activeStoreIds = activeStores.map((s) => s._id);
        if (activeStoreIds.length > 0) {
            query.storeId = { $in: activeStoreIds };
        }
    }

    const skip = (page - 1) * limit;
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

    // Build sort object
    const sortObj = {};
    if (sort.startsWith('-')) {
        sortObj[sort.slice(1)] = -1;
    } else {
        sortObj[sort] = 1;
    }

    const [products, total] = await Promise.all([
        Product.find(query)
            .populate('categoryId', 'name slug')
            .sort(sortObj)
            .skip(skip)
            .limit(safeLimit)
            .lean(),
        Product.countDocuments(query),
    ]);

    // Get prices and inventory for products
    const productIds = products.map((p) => p._id);

    const [prices, inventories] = await Promise.all([
        ProductPrice.find({
            productId: { $in: productIds },
            effectiveFrom: { $lte: new Date() },
            $or: [{ effectiveTo: null }, { effectiveTo: { $gte: new Date() } }],
        }).lean(),
        Inventory.find({ productId: { $in: productIds } }).lean(),
    ]);

    // Map prices and inventory to products
    const priceMap = new Map();
    prices.forEach((p) => {
        if (
            !priceMap.has(p.productId.toString()) ||
            p.effectiveFrom > priceMap.get(p.productId.toString()).effectiveFrom
        ) {
            priceMap.set(p.productId.toString(), p);
        }
    });

    const inventoryMap = new Map();
    inventories.forEach((i) => inventoryMap.set(i.productId.toString(), i));

    const enrichedProducts = products.map((product) => ({
        ...product,
        currentPrice: priceMap.get(product._id.toString()) || null,
        inventory: inventoryMap.get(product._id.toString()) || null,
    }));

    // Filter by price if needed
    let filteredProducts = enrichedProducts;
    if (minPrice !== undefined || maxPrice !== undefined) {
        filteredProducts = enrichedProducts.filter((p) => {
            if (!p.currentPrice) return false;
            if (minPrice !== undefined && p.currentPrice.price < minPrice)
                return false;
            if (maxPrice !== undefined && p.currentPrice.price > maxPrice)
                return false;
            return true;
        });
    }

    return {
        products: filteredProducts,
        pagination: {
            page,
            limit: safeLimit,
            total,
            pages: Math.ceil(total / safeLimit),
        },
    };
};

/**
 * Add product images
 */
const addProductImages = async (productId, sellerId, images) => {
    const product = await Product.findById(productId).populate('storeId');
    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    if (product.storeId.sellerId.toString() !== sellerId.toString()) {
        throw new ApiError(
            403,
            "You don't have permission to modify this product"
        );
    }

    // Get max sort order
    const maxOrder = await ProductImage.findOne({ productId })
        .sort({ sortOrder: -1 })
        .select('sortOrder');

    let nextOrder = (maxOrder?.sortOrder || 0) + 1;

    const imageRecords = images.map((img, index) => ({
        productId,
        url: img.url,
        altText: img.altText,
        sortOrder: img.sortOrder ?? nextOrder + index,
    }));

    const created = await ProductImage.insertMany(imageRecords);
    return created;
};

/**
 * Remove product image
 */
const removeProductImage = async (productId, imageId, sellerId) => {
    const product = await Product.findById(productId).populate('storeId');
    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    if (product.storeId.sellerId.toString() !== sellerId.toString()) {
        throw new ApiError(
            403,
            "You don't have permission to modify this product"
        );
    }

    const result = await ProductImage.findOneAndDelete({
        _id: imageId,
        productId,
    });

    if (!result) {
        throw new ApiError(404, 'Image not found');
    }

    return true;
};

/**
 * Get price history for a product
 */
const getPriceHistory = async (productId, sellerId = null) => {
    const product = await Product.findById(productId).populate('storeId');
    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    // If sellerId provided, verify ownership
    if (
        sellerId &&
        product.storeId.sellerId.toString() !== sellerId.toString()
    ) {
        throw new ApiError(
            403,
            "You don't have permission to view this product's price history"
        );
    }

    const priceHistory = await ProductPrice.find({ productId })
        .sort({ effectiveFrom: -1 })
        .lean();

    return {
        productId,
        productTitle: product.identity.title,
        priceHistory: priceHistory.map((p) => ({
            price: p.price,
            currency: p.currency,
            effectiveFrom: p.effectiveFrom,
            effectiveTo: p.effectiveTo,
            isCurrent: !p.effectiveTo || p.effectiveTo > new Date(),
        })),
    };
};

export {
    createProduct,
    getProductWithDetails,
    getPublishedProduct,
    updateProduct,
    publishProduct,
    archiveProduct,
    deleteProduct,
    getProductsByStore,
    searchProducts,
    addProductImages,
    removeProductImage,
    getPriceHistory,
};
