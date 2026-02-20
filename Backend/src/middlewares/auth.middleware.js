import { ApiError } from '../utils/ApiError.js';
import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/users.model.js';
import { ACCOUNT_STATUS } from '../constants/index.js';

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user to request
 */
const authenticate = async (req, _, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(401, 'Authorization token missing');
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyToken(token, process.env.ACCESS_TOKEN_SECRET);

        // Fetch user from database to ensure account is still active
        const user = await User.findById(decoded.id).select(
            '-passwordHash -__v'
        );

        if (!user) {
            throw new ApiError(401, 'User not found');
        }

        if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
            throw new ApiError(403, 'Account is suspended or deleted');
        }

        // Attach user info to request
        req.user = {
            id: user._id.toString(),
            _id: user._id,
            email: user.email,
            role: user.role,
            accountStatus: user.accountStatus,
        };

        next();
    } catch (err) {
        if (err instanceof ApiError) {
            throw err;
        }
        throw new ApiError(401, 'Invalid or expired token');
    }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if no token
 */
const optionalAuth = async (req, _, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyToken(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decoded.id).select(
            '-passwordHash -__v'
        );

        if (user && user.accountStatus === ACCOUNT_STATUS.ACTIVE) {
            req.user = {
                id: user._id.toString(),
                _id: user._id,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus,
            };
        }
    } catch (err) {
        // Ignore token errors for optional auth
    }

    next();
};

// Alias for backwards compatibility
const authMiddleware = authenticate;

export { authenticate, authMiddleware, optionalAuth };
