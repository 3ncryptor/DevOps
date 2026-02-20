import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {
    createStore,
    getStoreById,
    getStoreBySlug,
    getStoresBySeller,
    updateStore,
    listStores,
    closeStore,
    getStoreWithStats,
} from '../services/store.service.js';

/**
 * Extract client info from request
 */
const getClientInfo = (req) => ({
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent'),
});

// ============== SELLER ENDPOINTS ==============

/**
 * @desc    Create a new store
 * @route   POST /api/v1/stores
 * @access  Private (SELLER role, approved only)
 */
const createStoreHandler = asyncHandler(async (req, res) => {
    const { ipAddress, userAgent } = getClientInfo(req);
    const store = await createStore(
        req.seller._id,
        req.body,
        ipAddress,
        userAgent
    );

    res.status(201).json(
        new ApiResponse(201, store, 'Store created successfully')
    );
});

/**
 * @desc    Get my stores
 * @route   GET /api/v1/stores/my-stores
 * @access  Private (SELLER role)
 */
const getMyStores = asyncHandler(async (req, res) => {
    const stores = await getStoresBySeller(req.seller._id);

    res.status(200).json(new ApiResponse(200, stores, 'Stores retrieved'));
});

/**
 * @desc    Get my store by ID
 * @route   GET /api/v1/stores/my-stores/:storeId
 * @access  Private (SELLER role)
 */
const getMyStoreById = asyncHandler(async (req, res) => {
    // req.store is attached by ownership middleware
    const store = await getStoreWithStats(req.params.storeId);

    res.status(200).json(new ApiResponse(200, store, 'Store retrieved'));
});

/**
 * @desc    Update my store
 * @route   PATCH /api/v1/stores/my-stores/:storeId
 * @access  Private (SELLER role)
 */
const updateMyStore = asyncHandler(async (req, res) => {
    const { ipAddress, userAgent } = getClientInfo(req);
    const store = await updateStore(
        req.params.storeId,
        req.seller._id,
        req.body,
        ipAddress,
        userAgent
    );

    res.status(200).json(
        new ApiResponse(200, store, 'Store updated successfully')
    );
});

/**
 * @desc    Close my store
 * @route   POST /api/v1/stores/my-stores/:storeId/close
 * @access  Private (SELLER role)
 */
const closeMyStore = asyncHandler(async (req, res) => {
    const { ipAddress, userAgent } = getClientInfo(req);
    const store = await closeStore(
        req.params.storeId,
        req.seller._id,
        ipAddress,
        userAgent
    );

    res.status(200).json(
        new ApiResponse(200, store, 'Store closed successfully')
    );
});

// ============== PUBLIC ENDPOINTS ==============

/**
 * @desc    List all active stores
 * @route   GET /api/v1/stores
 * @access  Public
 */
const listAllStores = asyncHandler(async (req, res) => {
    const { search, city, page = 1, limit = 20 } = req.query;

    const result = await listStores({
        search,
        city,
        page: parseInt(page),
        limit: parseInt(limit),
    });

    res.status(200).json(new ApiResponse(200, result, 'Stores retrieved'));
});

/**
 * @desc    Get store by slug
 * @route   GET /api/v1/stores/:slug
 * @access  Public
 */
const getStoreBySlugHandler = asyncHandler(async (req, res) => {
    const store = await getStoreBySlug(req.params.slug);

    res.status(200).json(new ApiResponse(200, store, 'Store retrieved'));
});

/**
 * @desc    Get store by ID
 * @route   GET /api/v1/stores/id/:storeId
 * @access  Public
 */
const getStoreByIdHandler = asyncHandler(async (req, res) => {
    const store = await getStoreWithStats(req.params.storeId);

    res.status(200).json(new ApiResponse(200, store, 'Store retrieved'));
});

export {
    // Seller endpoints
    createStoreHandler,
    getMyStores,
    getMyStoreById,
    updateMyStore,
    closeMyStore,
    // Public endpoints
    listAllStores,
    getStoreBySlugHandler,
    getStoreByIdHandler,
};
