import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    logoutAllDevices,
    changePassword,
} from '../services/auth.service.js';
import { TOKEN_EXPIRY } from '../constants/index.js';

// Cookie options for refresh token
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY.REFRESH_TOKEN_MS,
};

/**
 * Extract client info from request
 */
const getClientInfo = (req) => ({
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent'),
});

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
    const { ipAddress, userAgent } = getClientInfo(req);
    const user = await registerUser(req.body, ipAddress, userAgent);

    res.status(201).json(
        new ApiResponse(201, user, 'User registered successfully')
    );
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
    const { ipAddress, userAgent } = getClientInfo(req);
    const { user, accessToken, refreshToken } = await loginUser(
        req.body,
        ipAddress,
        userAgent
    );

    // Set refresh token in httpOnly cookie (more secure)
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    res.status(200).json(
        new ApiResponse(200, { user, accessToken }, 'Login successful')
    );
});

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 * @access  Public (requires valid refresh token)
 */
const refresh = asyncHandler(async (req, res) => {
    // Get refresh token from cookie or request body
    const refreshTokenValue =
        req.cookies?.refreshToken || req.body.refreshToken;

    const { ipAddress, userAgent } = getClientInfo(req);
    const { user, accessToken, refreshToken } = await refreshAccessToken(
        refreshTokenValue,
        ipAddress,
        userAgent
    );

    // Set new refresh token in cookie (rotation)
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    res.status(200).json(
        new ApiResponse(
            200,
            { user, accessToken },
            'Token refreshed successfully'
        )
    );
});

/**
 * @desc    Logout user (revoke refresh token)
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
    const refreshTokenValue =
        req.cookies?.refreshToken || req.body.refreshToken;
    const { ipAddress, userAgent } = getClientInfo(req);

    await logoutUser(req.user.id, refreshTokenValue, ipAddress, userAgent);

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });

    res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

/**
 * @desc    Logout from all devices
 * @route   POST /api/v1/auth/logout-all
 * @access  Private
 */
const logoutAll = asyncHandler(async (req, res) => {
    const { ipAddress, userAgent } = getClientInfo(req);
    const result = await logoutAllDevices(req.user.id, ipAddress, userAgent);

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });

    res.status(200).json(
        new ApiResponse(200, result, 'Logged out from all devices')
    );
});

/**
 * @desc    Change password
 * @route   POST /api/v1/auth/change-password
 * @access  Private
 */
const changePasswordHandler = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const { ipAddress, userAgent } = getClientInfo(req);

    await changePassword(
        req.user.id,
        currentPassword,
        newPassword,
        ipAddress,
        userAgent
    );

    // Clear the refresh token cookie (force re-login)
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });

    res.status(200).json(
        new ApiResponse(
            200,
            null,
            'Password changed successfully. Please login again.'
        )
    );
});

/**
 * @desc    Get current user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getCurrentUser = asyncHandler(async (req, res) => {
    // req.user is set by auth middleware
    res.status(200).json(
        new ApiResponse(200, req.user, 'Current user retrieved')
    );
});

export {
    register,
    login,
    refresh,
    logout,
    logoutAll,
    changePasswordHandler,
    getCurrentUser,
};
