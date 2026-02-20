import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {
    registerSeller,
    getSellerByUserId,
    getSellerById,
    updateSeller,
    submitVerificationDocuments,
    getVerificationStatus,
    listSellers,
    approveSeller,
    rejectSeller,
    suspendSeller,
    reactivateSeller,
    getPendingSellers,
    getSellerWithDetails,
} from '../services/seller.service.js';
import {
    getStoreOverview,
    getStoreSalesReport,
    getStoreCustomerAnalytics,
    getStoreDailyMetrics,
} from '../services/analytics.service.js';

/**
 * Extract client info from request
 */
const getClientInfo = (req) => ({
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent'),
});

// ============== SELLER ENDPOINTS ==============

/**
 * @desc    Register as a seller
 * @route   POST /api/v1/sellers/register
 * @access  Private (USER role)
 */
const registerAsSeller = asyncHandler(async (req, res) => {
    const { ipAddress, userAgent } = getClientInfo(req);
    const seller = await registerSeller(
        req.user.id,
        req.body,
        ipAddress,
        userAgent
    );

    res.status(201).json(
        new ApiResponse(
            201,
            seller,
            'Seller registration successful. Pending approval.'
        )
    );
});

/**
 * @desc    Get my seller profile
 * @route   GET /api/v1/sellers/me
 * @access  Private (SELLER role)
 */
const getMySellerProfile = asyncHandler(async (req, res) => {
    const seller = await getSellerByUserId(req.user.id);

    res.status(200).json(
        new ApiResponse(200, seller, 'Seller profile retrieved')
    );
});

/**
 * @desc    Update my seller profile
 * @route   PATCH /api/v1/sellers/me
 * @access  Private (SELLER role)
 */
const updateMySellerProfile = asyncHandler(async (req, res) => {
    const { ipAddress, userAgent } = getClientInfo(req);

    // Get seller ID from attached seller (via middleware)
    const sellerId = req.seller._id;
    const seller = await updateSeller(
        sellerId,
        req.user.id,
        req.body,
        ipAddress,
        userAgent
    );

    res.status(200).json(
        new ApiResponse(200, seller, 'Seller profile updated')
    );
});

/**
 * @desc    Submit verification documents
 * @route   POST /api/v1/sellers/me/documents
 * @access  Private (SELLER role)
 */
const submitDocuments = asyncHandler(async (req, res) => {
    const { ipAddress, userAgent } = getClientInfo(req);
    const { documents } = req.body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
        return res
            .status(400)
            .json(new ApiResponse(400, null, 'Documents array is required'));
    }

    const verification = await submitVerificationDocuments(
        req.seller._id,
        documents,
        ipAddress,
        userAgent
    );

    res.status(200).json(
        new ApiResponse(
            200,
            verification,
            'Documents submitted for verification'
        )
    );
});

/**
 * @desc    Get my verification status
 * @route   GET /api/v1/sellers/me/verification
 * @access  Private (SELLER role)
 */
const getMyVerificationStatus = asyncHandler(async (req, res) => {
    const verification = await getVerificationStatus(req.seller._id);

    res.status(200).json(
        new ApiResponse(200, verification, 'Verification status retrieved')
    );
});

// ============== ADMIN ENDPOINTS ==============

/**
 * @desc    List all sellers
 * @route   GET /api/v1/admin/sellers
 * @access  Private (SUPER_ADMIN role)
 */
const getAllSellers = asyncHandler(async (req, res) => {
    const { status, search, page = 1, limit = 20 } = req.query;

    const result = await listSellers({
        status,
        search,
        page: parseInt(page),
        limit: parseInt(limit),
    });

    res.status(200).json(new ApiResponse(200, result, 'Sellers retrieved'));
});

/**
 * @desc    Get pending sellers
 * @route   GET /api/v1/admin/sellers/pending
 * @access  Private (SUPER_ADMIN role)
 */
const getPendingSellersList = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const result = await getPendingSellers(parseInt(page), parseInt(limit));

    res.status(200).json(
        new ApiResponse(200, result, 'Pending sellers retrieved')
    );
});

/**
 * @desc    Get seller details
 * @route   GET /api/v1/admin/sellers/:sellerId
 * @access  Private (SUPER_ADMIN role)
 */
const getSellerDetails = asyncHandler(async (req, res) => {
    const result = await getSellerWithDetails(req.params.sellerId);

    res.status(200).json(
        new ApiResponse(200, result, 'Seller details retrieved')
    );
});

/**
 * @desc    Approve seller
 * @route   POST /api/v1/admin/sellers/:sellerId/approve
 * @access  Private (SUPER_ADMIN role)
 */
const approveSellerHandler = asyncHandler(async (req, res) => {
    const { ipAddress, userAgent } = getClientInfo(req);
    const { notes } = req.body || {};

    const seller = await approveSeller(
        req.params.sellerId,
        req.user.id,
        notes,
        ipAddress,
        userAgent
    );

    res.status(200).json(
        new ApiResponse(200, seller, 'Seller approved successfully')
    );
});

/**
 * @desc    Reject seller
 * @route   POST /api/v1/admin/sellers/:sellerId/reject
 * @access  Private (SUPER_ADMIN role)
 */
const rejectSellerHandler = asyncHandler(async (req, res) => {
    const { ipAddress, userAgent } = getClientInfo(req);
    const { reason } = req.body;

    const seller = await rejectSeller(
        req.params.sellerId,
        req.user.id,
        reason,
        ipAddress,
        userAgent
    );

    res.status(200).json(new ApiResponse(200, seller, 'Seller rejected'));
});

/**
 * @desc    Suspend seller
 * @route   POST /api/v1/admin/sellers/:sellerId/suspend
 * @access  Private (SUPER_ADMIN role)
 */
const suspendSellerHandler = asyncHandler(async (req, res) => {
    const { ipAddress, userAgent } = getClientInfo(req);
    const { reason } = req.body;

    const seller = await suspendSeller(
        req.params.sellerId,
        req.user.id,
        reason,
        ipAddress,
        userAgent
    );

    res.status(200).json(new ApiResponse(200, seller, 'Seller suspended'));
});

/**
 * @desc    Reactivate seller
 * @route   POST /api/v1/admin/sellers/:sellerId/reactivate
 * @access  Private (SUPER_ADMIN role)
 */
const reactivateSellerHandler = asyncHandler(async (req, res) => {
    const { ipAddress, userAgent } = getClientInfo(req);

    const seller = await reactivateSeller(
        req.params.sellerId,
        req.user.id,
        ipAddress,
        userAgent
    );

    res.status(200).json(new ApiResponse(200, seller, 'Seller reactivated'));
});

// ============== ANALYTICS ENDPOINTS ==============

/**
 * @desc    Get store analytics overview
 * @route   GET /api/v1/sellers/analytics/store/:storeId
 * @access  Private (SELLER - store owner)
 */
const getStoreAnalytics = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { days } = req.query;

    const analytics = await getStoreOverview(storeId, parseInt(days) || 30);

    res.status(200).json(
        new ApiResponse(200, analytics, 'Store analytics retrieved')
    );
});

/**
 * @desc    Get store sales report
 * @route   GET /api/v1/sellers/analytics/store/:storeId/sales
 * @access  Private (SELLER - store owner)
 */
const getStoreSalesHandler = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { startDate, endDate } = req.query;

    const report = await getStoreSalesReport(storeId, startDate, endDate);

    res.status(200).json(
        new ApiResponse(200, report, 'Sales report retrieved')
    );
});

/**
 * @desc    Get store customer analytics
 * @route   GET /api/v1/sellers/analytics/store/:storeId/customers
 * @access  Private (SELLER - store owner)
 */
const getStoreCustomersHandler = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { days } = req.query;

    const analytics = await getStoreCustomerAnalytics(
        storeId,
        parseInt(days) || 30
    );

    res.status(200).json(
        new ApiResponse(200, analytics, 'Customer analytics retrieved')
    );
});

/**
 * @desc    Get store daily metrics
 * @route   GET /api/v1/sellers/analytics/store/:storeId/daily
 * @access  Private (SELLER - store owner)
 */
const getStoreDailyHandler = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { days } = req.query;

    const metrics = await getStoreDailyMetrics(storeId, parseInt(days) || 30);

    res.status(200).json(
        new ApiResponse(200, metrics, 'Daily metrics retrieved')
    );
});

export {
    // Seller endpoints
    registerAsSeller,
    getMySellerProfile,
    updateMySellerProfile,
    submitDocuments,
    getMyVerificationStatus,
    // Analytics endpoints
    getStoreAnalytics,
    getStoreSalesHandler,
    getStoreCustomersHandler,
    getStoreDailyHandler,
    // Admin endpoints
    getAllSellers,
    getPendingSellersList,
    getSellerDetails,
    approveSellerHandler,
    rejectSellerHandler,
    suspendSellerHandler,
    reactivateSellerHandler,
};
