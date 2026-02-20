import { Router } from 'express';
import {
    createProductHandler,
    getMyProducts,
    getMyProductById,
    updateMyProduct,
    publishMyProduct,
    archiveMyProduct,
    deleteMyProduct,
    addProductImagesHandler,
    removeProductImageHandler,
    updateProductInventory,
    getLowStock,
    getInventoryList,
    getPriceHistoryHandler,
    searchProductsHandler,
    getProductById,
    getProductsByStoreHandler,
} from '../../controllers/product.controller.js';
import {
    authenticate,
    optionalAuth,
} from '../../middlewares/auth.middleware.js';
import {
    requireApprovedSeller,
    checkProductOwnership,
} from '../../middlewares/ownership.middleware.js';

const router = Router();

// ============== PUBLIC ROUTES ==============

/**
 * @route   GET /api/v1/products
 * @desc    Search products
 * @access  Public
 */
router.get('/', optionalAuth, searchProductsHandler);

/**
 * @route   GET /api/v1/products/store/:storeId
 * @desc    Get products by store
 * @access  Public
 */
router.get('/store/:storeId', optionalAuth, getProductsByStoreHandler);

/**
 * @route   GET /api/v1/products/:productId
 * @desc    Get product by ID (public - only published)
 * @access  Public
 */
router.get('/:productId', optionalAuth, getProductById);

// ============== SELLER ROUTES ==============

/**
 * @route   POST /api/v1/products
 * @desc    Create a new product
 * @access  Private (Approved SELLER)
 */
router.post('/', authenticate, requireApprovedSeller, createProductHandler);

/**
 * @route   GET /api/v1/products/my-products
 * @desc    Get my products
 * @access  Private (SELLER)
 */
router.get('/my-products', authenticate, requireApprovedSeller, getMyProducts);

/**
 * @route   GET /api/v1/products/low-stock
 * @desc    Get low stock products
 * @access  Private (SELLER)
 */
router.get('/low-stock', authenticate, requireApprovedSeller, getLowStock);

/**
 * @route   GET /api/v1/products/inventory
 * @desc    Get store inventory
 * @access  Private (SELLER)
 */
router.get('/inventory', authenticate, requireApprovedSeller, getInventoryList);

/**
 * @route   GET /api/v1/products/my-products/:productId
 * @desc    Get my product by ID
 * @access  Private (SELLER)
 */
router.get(
    '/my-products/:productId',
    authenticate,
    requireApprovedSeller,
    checkProductOwnership,
    getMyProductById
);

/**
 * @route   PATCH /api/v1/products/my-products/:productId
 * @desc    Update my product
 * @access  Private (SELLER)
 */
router.patch(
    '/my-products/:productId',
    authenticate,
    requireApprovedSeller,
    checkProductOwnership,
    updateMyProduct
);

/**
 * @route   DELETE /api/v1/products/my-products/:productId
 * @desc    Delete my product
 * @access  Private (SELLER)
 */
router.delete(
    '/my-products/:productId',
    authenticate,
    requireApprovedSeller,
    checkProductOwnership,
    deleteMyProduct
);

/**
 * @route   POST /api/v1/products/my-products/:productId/publish
 * @desc    Publish product
 * @access  Private (SELLER)
 */
router.post(
    '/my-products/:productId/publish',
    authenticate,
    requireApprovedSeller,
    checkProductOwnership,
    publishMyProduct
);

/**
 * @route   POST /api/v1/products/my-products/:productId/archive
 * @desc    Archive product
 * @access  Private (SELLER)
 */
router.post(
    '/my-products/:productId/archive',
    authenticate,
    requireApprovedSeller,
    checkProductOwnership,
    archiveMyProduct
);

/**
 * @route   POST /api/v1/products/my-products/:productId/images
 * @desc    Add images to product
 * @access  Private (SELLER)
 */
router.post(
    '/my-products/:productId/images',
    authenticate,
    requireApprovedSeller,
    checkProductOwnership,
    addProductImagesHandler
);

/**
 * @route   DELETE /api/v1/products/my-products/:productId/images/:imageId
 * @desc    Remove image from product
 * @access  Private (SELLER)
 */
router.delete(
    '/my-products/:productId/images/:imageId',
    authenticate,
    requireApprovedSeller,
    checkProductOwnership,
    removeProductImageHandler
);

/**
 * @route   PATCH /api/v1/products/my-products/:productId/inventory
 * @desc    Update product inventory
 * @access  Private (SELLER)
 */
router.patch(
    '/my-products/:productId/inventory',
    authenticate,
    requireApprovedSeller,
    checkProductOwnership,
    updateProductInventory
);

/**
 * @route   GET /api/v1/products/my-products/:productId/price-history
 * @desc    Get product price history
 * @access  Private (SELLER)
 */
router.get(
    '/my-products/:productId/price-history',
    authenticate,
    requireApprovedSeller,
    checkProductOwnership,
    getPriceHistoryHandler
);

export default router;
