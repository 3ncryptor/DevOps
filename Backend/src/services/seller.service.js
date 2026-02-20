import mongoose from 'mongoose';
import { Seller } from '../models/seller.model.js';
import { SellerVerification } from '../models/sellerVerification.model.js';
import { User } from '../models/users.model.js';
import { Store } from '../models/store.model.js';
import { ApiError } from '../utils/ApiError.js';
import { createAuditLog } from './audit.service.js';
import { withTransaction } from '../db/transactions.js';
import {
    ROLES,
    SELLER_STATUS,
    VERIFICATION_STATUS,
    AUDIT_ACTION,
    PAGINATION,
} from '../constants/index.js';

/**
 * Register as a seller (onboarding step 1)
 * Creates seller profile and links to user
 */
const registerSeller = async (
    userId,
    sellerData,
    ipAddress = null,
    userAgent = null
) => {
    const { business, contact } = sellerData;

    // Validate required fields
    if (
        !business?.legalName ||
        !business?.displayName ||
        !business?.businessType
    ) {
        throw new ApiError(
            400,
            'Business legal name, display name, and type are required'
        );
    }

    if (!contact?.email) {
        throw new ApiError(400, 'Contact email is required');
    }

    // Check if user already has a seller profile
    const existingSeller = await Seller.findOne({ userId });
    if (existingSeller) {
        throw new ApiError(409, 'You already have a seller profile');
    }

    // Get user to verify they exist and are a regular user
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Use transaction for atomicity
    const result = await withTransaction(async (session) => {
        // Create seller profile
        const [seller] = await Seller.create(
            [
                {
                    userId,
                    business: {
                        legalName: business.legalName.trim(),
                        displayName: business.displayName.trim(),
                        businessType: business.businessType,
                        taxIdentifier: business.taxIdentifier?.trim(),
                    },
                    contact: {
                        email: contact.email.toLowerCase().trim(),
                        phone: contact.phone?.trim(),
                    },
                    status: SELLER_STATUS.PENDING,
                },
            ],
            { session }
        );

        // Create verification record
        await SellerVerification.create(
            [
                {
                    sellerId: seller._id,
                    verificationStatus: VERIFICATION_STATUS.PENDING,
                    documents: [],
                },
            ],
            { session }
        );

        // Update user role to SELLER
        await User.findByIdAndUpdate(
            userId,
            { role: ROLES.SELLER },
            { session }
        );

        return seller;
    });

    // Log registration
    await createAuditLog({
        action: AUDIT_ACTION.SELLER_REGISTER,
        userId,
        targetType: 'Seller',
        targetId: result._id,
        details: { businessName: business.displayName },
        ipAddress,
        userAgent,
    });

    return result;
};

/**
 * Get seller profile by user ID
 */
const getSellerByUserId = async (userId) => {
    const seller = await Seller.findOne({ userId }).populate(
        'userId',
        'email accountStatus'
    );

    if (!seller) {
        throw new ApiError(404, 'Seller profile not found');
    }

    return seller;
};

/**
 * Get seller profile by ID
 */
const getSellerById = async (sellerId) => {
    const seller = await Seller.findById(sellerId).populate(
        'userId',
        'email accountStatus'
    );

    if (!seller) {
        throw new ApiError(404, 'Seller not found');
    }

    return seller;
};

/**
 * Update seller profile
 */
const updateSeller = async (
    sellerId,
    userId,
    updateData,
    ipAddress = null,
    userAgent = null
) => {
    const seller = await Seller.findById(sellerId);
    if (!seller) {
        throw new ApiError(404, 'Seller not found');
    }

    // Verify ownership
    if (seller.userId.toString() !== userId) {
        throw new ApiError(403, 'You can only update your own seller profile');
    }

    // Fields that can be updated
    const allowedUpdates = [
        'business.displayName',
        'business.taxIdentifier',
        'contact.phone',
    ];
    const updates = {};
    const previousState = seller.toObject();

    // Build update object
    if (updateData.business?.displayName) {
        updates['business.displayName'] =
            updateData.business.displayName.trim();
    }
    if (updateData.business?.taxIdentifier !== undefined) {
        updates['business.taxIdentifier'] =
            updateData.business.taxIdentifier?.trim();
    }
    if (updateData.contact?.phone !== undefined) {
        updates['contact.phone'] = updateData.contact.phone?.trim();
    }

    if (Object.keys(updates).length === 0) {
        throw new ApiError(400, 'No valid fields to update');
    }

    const updatedSeller = await Seller.findByIdAndUpdate(
        sellerId,
        { $set: updates },
        { new: true }
    );

    // Log update
    await createAuditLog({
        action: AUDIT_ACTION.SELLER_UPDATE,
        userId,
        targetType: 'Seller',
        targetId: sellerId,
        previousState,
        newState: updatedSeller.toObject(),
        ipAddress,
        userAgent,
        sellerId,
    });

    return updatedSeller;
};

/**
 * Submit verification documents
 */
const submitVerificationDocuments = async (
    sellerId,
    documents,
    ipAddress = null,
    userAgent = null
) => {
    const seller = await Seller.findById(sellerId);
    if (!seller) {
        throw new ApiError(404, 'Seller not found');
    }

    let verification = await SellerVerification.findOne({ sellerId });
    if (!verification) {
        verification = await SellerVerification.create({
            sellerId,
            verificationStatus: VERIFICATION_STATUS.PENDING,
            documents: [],
        });
    }

    // Add new documents
    const newDocuments = documents.map((doc) => ({
        documentType: doc.documentType,
        documentNumber: doc.documentNumber,
        fileUrl: doc.fileUrl,
        status: 'PENDING',
        uploadedAt: new Date(),
    }));

    verification.documents.push(...newDocuments);
    verification.verificationStatus = VERIFICATION_STATUS.UNDER_REVIEW;
    await verification.save();

    // Log submission
    await createAuditLog({
        action: AUDIT_ACTION.SELLER_VERIFICATION_SUBMIT,
        userId: seller.userId,
        targetType: 'SellerVerification',
        targetId: verification._id,
        details: { documentCount: documents.length },
        ipAddress,
        userAgent,
        sellerId,
    });

    return verification;
};

/**
 * Get seller verification status
 */
const getVerificationStatus = async (sellerId) => {
    const verification = await SellerVerification.findOne({ sellerId });
    if (!verification) {
        throw new ApiError(404, 'Verification record not found');
    }

    return verification;
};

// ============== ADMIN FUNCTIONS ==============

/**
 * List all sellers with pagination (Admin)
 */
const listSellers = async ({
    status,
    search,
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
}) => {
    const query = {};

    if (status) {
        query.status = status;
    }

    if (search) {
        query.$or = [
            { 'business.legalName': { $regex: search, $options: 'i' } },
            { 'business.displayName': { $regex: search, $options: 'i' } },
            { 'contact.email': { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (page - 1) * limit;
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

    const [sellers, total] = await Promise.all([
        Seller.find(query)
            .populate('userId', 'email accountStatus createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .lean(),
        Seller.countDocuments(query),
    ]);

    return {
        sellers,
        pagination: {
            page,
            limit: safeLimit,
            total,
            pages: Math.ceil(total / safeLimit),
        },
    };
};

/**
 * Approve seller (Admin)
 */
const approveSeller = async (
    sellerId,
    adminId,
    notes = null,
    ipAddress = null,
    userAgent = null
) => {
    const seller = await Seller.findById(sellerId);
    if (!seller) {
        throw new ApiError(404, 'Seller not found');
    }

    if (seller.status === SELLER_STATUS.APPROVED) {
        throw new ApiError(400, 'Seller is already approved');
    }

    const previousState = seller.toObject();

    seller.status = SELLER_STATUS.APPROVED;
    seller.approvedAt = new Date();
    await seller.save();

    // Update verification status
    await SellerVerification.findOneAndUpdate(
        { sellerId },
        {
            verificationStatus: VERIFICATION_STATUS.APPROVED,
            reviewedBy: adminId,
            reviewedAt: new Date(),
            adminNotes: notes,
        }
    );

    // Log approval
    await createAuditLog({
        action: AUDIT_ACTION.SELLER_APPROVE,
        userId: adminId,
        targetType: 'Seller',
        targetId: sellerId,
        previousState,
        newState: seller.toObject(),
        details: { notes },
        ipAddress,
        userAgent,
        sellerId,
    });

    return seller;
};

/**
 * Reject seller (Admin)
 */
const rejectSeller = async (
    sellerId,
    adminId,
    reason,
    ipAddress = null,
    userAgent = null
) => {
    if (!reason) {
        throw new ApiError(400, 'Rejection reason is required');
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
        throw new ApiError(404, 'Seller not found');
    }

    const previousState = seller.toObject();

    seller.status = SELLER_STATUS.REJECTED;
    await seller.save();

    // Update verification status
    await SellerVerification.findOneAndUpdate(
        { sellerId },
        {
            verificationStatus: VERIFICATION_STATUS.REJECTED,
            reviewedBy: adminId,
            reviewedAt: new Date(),
            adminNotes: reason,
        }
    );

    // Log rejection
    await createAuditLog({
        action: AUDIT_ACTION.SELLER_REJECT,
        userId: adminId,
        targetType: 'Seller',
        targetId: sellerId,
        previousState,
        newState: seller.toObject(),
        details: { reason },
        ipAddress,
        userAgent,
        sellerId,
    });

    return seller;
};

/**
 * Suspend seller (Admin)
 */
const suspendSeller = async (
    sellerId,
    adminId,
    reason,
    ipAddress = null,
    userAgent = null
) => {
    if (!reason) {
        throw new ApiError(400, 'Suspension reason is required');
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
        throw new ApiError(404, 'Seller not found');
    }

    if (seller.status === SELLER_STATUS.SUSPENDED) {
        throw new ApiError(400, 'Seller is already suspended');
    }

    const previousState = seller.toObject();

    await withTransaction(async (session) => {
        // Suspend seller
        seller.status = SELLER_STATUS.SUSPENDED;
        seller.suspendedAt = new Date();
        await seller.save({ session });

        // Suspend all their stores
        await Store.updateMany(
            { sellerId },
            { status: 'SUSPENDED' },
            { session }
        );
    });

    // Log suspension
    await createAuditLog({
        action: AUDIT_ACTION.SELLER_SUSPEND,
        userId: adminId,
        targetType: 'Seller',
        targetId: sellerId,
        previousState,
        newState: seller.toObject(),
        details: { reason },
        ipAddress,
        userAgent,
        sellerId,
    });

    return seller;
};

/**
 * Reactivate suspended seller (Admin)
 */
const reactivateSeller = async (
    sellerId,
    adminId,
    ipAddress = null,
    userAgent = null
) => {
    const seller = await Seller.findById(sellerId);
    if (!seller) {
        throw new ApiError(404, 'Seller not found');
    }

    if (seller.status !== SELLER_STATUS.SUSPENDED) {
        throw new ApiError(400, 'Seller is not suspended');
    }

    const previousState = seller.toObject();

    await withTransaction(async (session) => {
        // Reactivate seller
        seller.status = SELLER_STATUS.APPROVED;
        seller.suspendedAt = null;
        await seller.save({ session });

        // Reactivate their stores
        await Store.updateMany({ sellerId }, { status: 'ACTIVE' }, { session });
    });

    // Log reactivation
    await createAuditLog({
        action: AUDIT_ACTION.SELLER_ACTIVATE,
        userId: adminId,
        targetType: 'Seller',
        targetId: sellerId,
        previousState,
        newState: seller.toObject(),
        ipAddress,
        userAgent,
        sellerId,
    });

    return seller;
};

/**
 * Get sellers pending review (Admin)
 */
const getPendingSellers = async (page = 1, limit = 20) => {
    return listSellers({ status: SELLER_STATUS.PENDING, page, limit });
};

/**
 * Get seller with full details (Admin)
 */
const getSellerWithDetails = async (sellerId) => {
    const seller = await Seller.findById(sellerId).populate(
        'userId',
        'email accountStatus createdAt lastLoginAt'
    );

    if (!seller) {
        throw new ApiError(404, 'Seller not found');
    }

    const [verification, stores] = await Promise.all([
        SellerVerification.findOne({ sellerId }),
        Store.find({ sellerId }).lean(),
    ]);

    return {
        seller,
        verification,
        stores,
    };
};

export {
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
};
