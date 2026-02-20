import { Router } from 'express';
import {
    registerAsSeller,
    getMySellerProfile,
    updateMySellerProfile,
    submitDocuments,
    getMyVerificationStatus,
} from '../../controllers/seller.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import {
    authorizeRoles,
    requireSeller,
} from '../../middlewares/role.middleware.js';
import { checkSellerOwnership } from '../../middlewares/ownership.middleware.js';
import ROLES from '../../constants/roles.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/sellers/register
 * @desc    Register as a seller (USER can become SELLER)
 * @access  Private (USER role)
 */
router.post('/register', authorizeRoles(ROLES.USER), registerAsSeller);

/**
 * @route   GET /api/v1/sellers/me
 * @desc    Get current seller's profile
 * @access  Private (SELLER role)
 */
router.get('/me', requireSeller, checkSellerOwnership, getMySellerProfile);

/**
 * @route   PATCH /api/v1/sellers/me
 * @desc    Update current seller's profile
 * @access  Private (SELLER role)
 */
router.patch('/me', requireSeller, checkSellerOwnership, updateMySellerProfile);

/**
 * @route   POST /api/v1/sellers/me/documents
 * @desc    Submit verification documents
 * @access  Private (SELLER role)
 */
router.post(
    '/me/documents',
    requireSeller,
    checkSellerOwnership,
    submitDocuments
);

/**
 * @route   GET /api/v1/sellers/me/verification
 * @desc    Get verification status
 * @access  Private (SELLER role)
 */
router.get(
    '/me/verification',
    requireSeller,
    checkSellerOwnership,
    getMyVerificationStatus
);

export default router;
