import { ApiError } from '../utils/ApiError.js';
import ROLES, { ROLE_HIERARCHY } from '../constants/roles.js';

/**
 * Authorize specific roles
 * Usage: authorizeRoles(ROLES.ADMIN, ROLES.SELLER)
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, _, next) => {
        if (!req.user) {
            throw new ApiError(401, 'Authentication required');
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new ApiError(403, 'Access denied. Insufficient permissions.');
        }
        next();
    };
};

/**
 * Require minimum role level based on hierarchy
 * Usage: requireMinRole(ROLES.SELLER)
 */
const requireMinRole = (minRole) => {
    return (req, _, next) => {
        if (!req.user) {
            throw new ApiError(401, 'Authentication required');
        }

        const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
        const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

        if (userLevel < requiredLevel) {
            throw new ApiError(403, 'Access denied. Insufficient role level.');
        }
        next();
    };
};

/**
 * Require user to be a seller
 */
const requireSeller = (req, _, next) => {
    if (!req.user) {
        throw new ApiError(401, 'Authentication required');
    }

    if (req.user.role !== ROLES.SELLER) {
        throw new ApiError(403, 'This action requires a seller account');
    }
    next();
};

/**
 * Require user to be a super admin
 */
const requireAdmin = (req, _, next) => {
    if (!req.user) {
        throw new ApiError(401, 'Authentication required');
    }

    if (req.user.role !== ROLES.SUPER_ADMIN) {
        throw new ApiError(
            403,
            'This action requires administrator privileges'
        );
    }
    next();
};

/**
 * Allow admin OR the resource owner
 * Useful for endpoints where both admin and owner should have access
 */
const adminOrSelf = (userIdField = 'id') => {
    return (req, _, next) => {
        if (!req.user) {
            throw new ApiError(401, 'Authentication required');
        }

        // Admin always has access
        if (req.user.role === ROLES.SUPER_ADMIN) {
            return next();
        }

        // Check if user is accessing their own resource
        const resourceUserId = req.params[userIdField] || req.params.userId;

        if (resourceUserId && resourceUserId === req.user.id) {
            return next();
        }

        throw new ApiError(403, 'Access denied');
    };
};

export {
    authorizeRoles,
    requireMinRole,
    requireSeller,
    requireAdmin,
    adminOrSelf,
};
