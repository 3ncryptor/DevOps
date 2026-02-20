import { Router } from 'express';
import {
    getAllSellers,
    getPendingSellersList,
    getSellerDetails,
    approveSellerHandler,
    rejectSellerHandler,
    suspendSellerHandler,
    reactivateSellerHandler,
} from '../../controllers/seller.controller.js';
import {
    getDashboard,
    getPlatformStats,
    getAllUsersHandler,
    getUserHandler,
    suspendUserHandler,
    activateUserHandler,
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getAuditLogsHandler,
    getAllStoresAdmin,
    suspendStoreHandler,
    activateStoreHandler,
} from '../../controllers/admin.controller.js';
import { getPaymentStatsHandler } from '../../controllers/payment.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

// All admin routes require authentication and SUPER_ADMIN role
router.use(authenticate);
router.use(requireAdmin);

// ============== DASHBOARD ==============

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get admin dashboard overview
 * @access  Private (SUPER_ADMIN)
 */
router.get('/dashboard', getDashboard);

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Get platform statistics
 * @access  Private (SUPER_ADMIN)
 */
router.get('/stats', getPlatformStats);

// ============== USER MANAGEMENT ==============

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users
 * @access  Private (SUPER_ADMIN)
 */
router.get('/users', getAllUsersHandler);

/**
 * @route   GET /api/v1/admin/users/:userId
 * @desc    Get user by ID
 * @access  Private (SUPER_ADMIN)
 */
router.get('/users/:userId', getUserHandler);

/**
 * @route   POST /api/v1/admin/users/:userId/suspend
 * @desc    Suspend a user
 * @access  Private (SUPER_ADMIN)
 */
router.post('/users/:userId/suspend', suspendUserHandler);

/**
 * @route   POST /api/v1/admin/users/:userId/activate
 * @desc    Activate a user
 * @access  Private (SUPER_ADMIN)
 */
router.post('/users/:userId/activate', activateUserHandler);

// ============== SELLER MANAGEMENT ==============

/**
 * @route   GET /api/v1/admin/sellers
 * @desc    List all sellers with pagination and filters
 * @access  Private (SUPER_ADMIN)
 */
router.get('/sellers', getAllSellers);

/**
 * @route   GET /api/v1/admin/sellers/pending
 * @desc    Get sellers pending approval
 * @access  Private (SUPER_ADMIN)
 */
router.get('/sellers/pending', getPendingSellersList);

/**
 * @route   GET /api/v1/admin/sellers/:sellerId
 * @desc    Get seller details with stores and verification
 * @access  Private (SUPER_ADMIN)
 */
router.get('/sellers/:sellerId', getSellerDetails);

/**
 * @route   POST /api/v1/admin/sellers/:sellerId/approve
 * @desc    Approve a seller
 * @access  Private (SUPER_ADMIN)
 */
router.post('/sellers/:sellerId/approve', approveSellerHandler);

/**
 * @route   POST /api/v1/admin/sellers/:sellerId/reject
 * @desc    Reject a seller
 * @access  Private (SUPER_ADMIN)
 */
router.post('/sellers/:sellerId/reject', rejectSellerHandler);

/**
 * @route   POST /api/v1/admin/sellers/:sellerId/suspend
 * @desc    Suspend a seller
 * @access  Private (SUPER_ADMIN)
 */
router.post('/sellers/:sellerId/suspend', suspendSellerHandler);

/**
 * @route   POST /api/v1/admin/sellers/:sellerId/reactivate
 * @desc    Reactivate a suspended seller
 * @access  Private (SUPER_ADMIN)
 */
router.post('/sellers/:sellerId/reactivate', reactivateSellerHandler);

// ============== STORE MANAGEMENT ==============

/**
 * @route   GET /api/v1/admin/stores
 * @desc    Get all stores
 * @access  Private (SUPER_ADMIN)
 */
router.get('/stores', getAllStoresAdmin);

/**
 * @route   POST /api/v1/admin/stores/:storeId/suspend
 * @desc    Suspend a store
 * @access  Private (SUPER_ADMIN)
 */
router.post('/stores/:storeId/suspend', suspendStoreHandler);

/**
 * @route   POST /api/v1/admin/stores/:storeId/activate
 * @desc    Activate a store
 * @access  Private (SUPER_ADMIN)
 */
router.post('/stores/:storeId/activate', activateStoreHandler);

// ============== CATEGORY MANAGEMENT ==============

/**
 * @route   GET /api/v1/admin/categories
 * @desc    Get all categories
 * @access  Private (SUPER_ADMIN)
 */
router.get('/categories', getAllCategories);

/**
 * @route   POST /api/v1/admin/categories
 * @desc    Create category
 * @access  Private (SUPER_ADMIN)
 */
router.post('/categories', createCategory);

/**
 * @route   PATCH /api/v1/admin/categories/:categoryId
 * @desc    Update category
 * @access  Private (SUPER_ADMIN)
 */
router.patch('/categories/:categoryId', updateCategory);

/**
 * @route   DELETE /api/v1/admin/categories/:categoryId
 * @desc    Delete category
 * @access  Private (SUPER_ADMIN)
 */
router.delete('/categories/:categoryId', deleteCategory);

// ============== PAYMENTS ==============

/**
 * @route   GET /api/v1/admin/payments/stats
 * @desc    Get payment statistics
 * @access  Private (SUPER_ADMIN)
 */
router.get('/payments/stats', getPaymentStatsHandler);

// ============== AUDIT LOGS ==============

/**
 * @route   GET /api/v1/admin/audit-logs
 * @desc    Get audit logs
 * @access  Private (SUPER_ADMIN)
 */
router.get('/audit-logs', getAuditLogsHandler);

export default router;
