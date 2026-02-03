/**
 * Admin Controller
 * Handles admin dashboard, user management, and platform-wide operations
 */

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import {
  getAllUsers,
  getUserById,
  suspendUser,
  activateUser,
  getUserStats
} from "../services/user.service.js";
import { getPaymentStats } from "../services/payment.service.js";
import { getAuditLogs, createAuditLog } from "../services/audit.service.js";
import { User } from "../models/users.model.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Store } from "../models/store.model.js";
import { Seller } from "../models/seller.model.js";
import { Category } from "../models/category.model.js";
import { PAGINATION, AUDIT_ACTION } from "../constants/platform.js";

/**
 * Extract client info from request
 */
const getClientInfo = (req) => ({
  ipAddress: req.ip || req.connection?.remoteAddress,
  userAgent: req.get("User-Agent")
});

// ============== DASHBOARD ==============

/**
 * @desc    Get admin dashboard overview
 * @route   GET /api/v1/admin/dashboard
 * @access  Private (SUPER_ADMIN)
 */
export const getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  // Parallel queries for dashboard data
  const [
    totalUsers,
    totalSellers,
    totalStores,
    totalProducts,
    pendingSellers,
    recentUsers,
    recentOrders,
    orderStats,
    userStats,
    paymentStats
  ] = await Promise.all([
    User.countDocuments(),
    Seller.countDocuments(),
    Store.countDocuments({ storeStatus: "ACTIVE" }),
    Product.countDocuments({ status: "PUBLISHED" }),
    Seller.countDocuments({ status: "PENDING" }),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$pricing.totalAmount" }
        }
      }
    ]),
    getUserStats(),
    getPaymentStats(thirtyDaysAgo.toISOString(), now.toISOString())
  ]);

  // Format order stats
  const orderStatsByStatus = {};
  orderStats.forEach(stat => {
    orderStatsByStatus[stat._id] = {
      count: stat.count,
      totalValue: stat.totalValue
    };
  });

  const dashboard = {
    overview: {
      totalUsers,
      totalSellers,
      totalStores,
      totalProducts
    },
    pending: {
      sellerApprovals: pendingSellers
    },
    recent: {
      usersLast30Days: recentUsers,
      ordersLast7Days: recentOrders
    },
    orders: orderStatsByStatus,
    users: userStats,
    payments: paymentStats
  };

  res
    .status(200)
    .json(new ApiResponse(200, dashboard, "Dashboard data retrieved successfully"));
});

/**
 * @desc    Get platform statistics
 * @route   GET /api/v1/admin/stats
 * @access  Private (SUPER_ADMIN)
 */
export const getPlatformStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const matchStage = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  // Get comprehensive platform statistics
  const [
    userGrowth,
    orderTrend,
    topStores,
    topProducts
  ] = await Promise.all([
    // User growth over time
    User.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]),
    
    // Order trend over time
    Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 },
          revenue: { $sum: "$pricing.totalAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]),
    
    // Top stores by orders
    Order.aggregate([
      { $match: { status: { $nin: ["CANCELLED", "REFUNDED"] } } },
      {
        $group: {
          _id: "$storeId",
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: "$pricing.totalAmount" }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "stores",
          localField: "_id",
          foreignField: "_id",
          as: "store"
        }
      },
      { $unwind: "$store" },
      {
        $project: {
          storeId: "$_id",
          storeName: "$store.storeIdentity.name",
          orderCount: 1,
          totalRevenue: 1
        }
      }
    ]),
    
    // Top products by quantity sold
    Order.aggregate([
      { $match: { status: { $nin: ["CANCELLED", "REFUNDED"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          quantitySold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.priceSnapshot", "$items.quantity"] } }
        }
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $project: {
          productId: "$_id",
          productName: "$product.identity.title",
          quantitySold: 1,
          revenue: 1
        }
      }
    ])
  ]);

  const stats = {
    userGrowth,
    orderTrend,
    topStores,
    topProducts
  };

  res
    .status(200)
    .json(new ApiResponse(200, stats, "Platform statistics retrieved successfully"));
});

// ============== USER MANAGEMENT ==============

/**
 * @desc    Get all users
 * @route   GET /api/v1/admin/users
 * @access  Private (SUPER_ADMIN)
 */
export const getAllUsersHandler = asyncHandler(async (req, res) => {
  const { page, limit, role, status, search } = req.query;

  const result = await getAllUsers({
    page: parseInt(page) || PAGINATION.DEFAULT_PAGE,
    limit: parseInt(limit) || PAGINATION.DEFAULT_LIMIT,
    role,
    status,
    search
  });

  res
    .status(200)
    .json(new ApiResponse(200, result, "Users retrieved successfully"));
});

/**
 * @desc    Get user by ID
 * @route   GET /api/v1/admin/users/:userId
 * @access  Private (SUPER_ADMIN)
 */
export const getUserHandler = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const result = await getUserById(userId);

  res
    .status(200)
    .json(new ApiResponse(200, result, "User retrieved successfully"));
});

/**
 * @desc    Suspend user
 * @route   POST /api/v1/admin/users/:userId/suspend
 * @access  Private (SUPER_ADMIN)
 */
export const suspendUserHandler = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getClientInfo(req);
  const { userId } = req.params;
  const { reason } = req.body;

  const user = await suspendUser(
    userId,
    req.user.id,
    reason,
    ipAddress,
    userAgent
  );

  res
    .status(200)
    .json(new ApiResponse(200, user, "User suspended successfully"));
});

/**
 * @desc    Activate user
 * @route   POST /api/v1/admin/users/:userId/activate
 * @access  Private (SUPER_ADMIN)
 */
export const activateUserHandler = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getClientInfo(req);
  const { userId } = req.params;

  const user = await activateUser(
    userId,
    req.user.id,
    ipAddress,
    userAgent
  );

  res
    .status(200)
    .json(new ApiResponse(200, user, "User activated successfully"));
});

// ============== CATEGORY MANAGEMENT ==============

/**
 * @desc    Get all categories
 * @route   GET /api/v1/admin/categories
 * @access  Private (SUPER_ADMIN)
 */
export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find()
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  // Build tree structure
  const categoryMap = new Map();
  const roots = [];

  categories.forEach(cat => {
    cat.children = [];
    categoryMap.set(cat._id.toString(), cat);
  });

  categories.forEach(cat => {
    if (cat.parentCategoryId) {
      const parent = categoryMap.get(cat.parentCategoryId.toString());
      if (parent) {
        parent.children.push(cat);
      }
    } else {
      roots.push(cat);
    }
  });

  res
    .status(200)
    .json(new ApiResponse(200, { categories: roots, flat: categories }, "Categories retrieved successfully"));
});

/**
 * @desc    Create category
 * @route   POST /api/v1/admin/categories
 * @access  Private (SUPER_ADMIN)
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { name, parentCategoryId, sortOrder } = req.body;

  // Generate slug
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Check if slug exists
  const existing = await Category.findOne({ slug });
  if (existing) {
    throw new ApiError(409, "Category with this name already exists");
  }

  const category = await Category.create({
    name,
    slug,
    parentCategoryId: parentCategoryId || null,
    sortOrder: sortOrder || 0
  });

  res
    .status(201)
    .json(new ApiResponse(201, category, "Category created successfully"));
});

/**
 * @desc    Update category
 * @route   PATCH /api/v1/admin/categories/:categoryId
 * @access  Private (SUPER_ADMIN)
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { name, parentCategoryId, sortOrder, isActive } = req.body;

  const category = await Category.findById(categoryId);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  if (name) {
    category.name = name;
    category.slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  if (parentCategoryId !== undefined) {
    // Prevent self-reference
    if (parentCategoryId === categoryId) {
      throw new ApiError(400, "Category cannot be its own parent");
    }
    category.parentCategoryId = parentCategoryId || null;
  }

  if (sortOrder !== undefined) {
    category.sortOrder = sortOrder;
  }

  if (isActive !== undefined) {
    category.isActive = isActive;
  }

  await category.save();

  res
    .status(200)
    .json(new ApiResponse(200, category, "Category updated successfully"));
});

/**
 * @desc    Delete category
 * @route   DELETE /api/v1/admin/categories/:categoryId
 * @access  Private (SUPER_ADMIN)
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  const category = await Category.findById(categoryId);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // Check if has children
  const childCount = await Category.countDocuments({ parentCategoryId: categoryId });
  if (childCount > 0) {
    throw new ApiError(400, "Cannot delete category with subcategories");
  }

  // Check if products use this category
  const productCount = await Product.countDocuments({ categoryId });
  if (productCount > 0) {
    throw new ApiError(400, "Cannot delete category with associated products");
  }

  await Category.findByIdAndDelete(categoryId);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Category deleted successfully"));
});

// ============== AUDIT LOGS ==============

/**
 * @desc    Get audit logs
 * @route   GET /api/v1/admin/audit-logs
 * @access  Private (SUPER_ADMIN)
 */
export const getAuditLogsHandler = asyncHandler(async (req, res) => {
  const {
    page,
    limit,
    action,
    userId,
    targetType,
    startDate,
    endDate
  } = req.query;

  const result = await getAuditLogs({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 50,
    action,
    userId,
    targetType,
    startDate,
    endDate
  });

  res
    .status(200)
    .json(new ApiResponse(200, result, "Audit logs retrieved successfully"));
});

// ============== STORE MANAGEMENT ==============

/**
 * @desc    Get all stores (admin view)
 * @route   GET /api/v1/admin/stores
 * @access  Private (SUPER_ADMIN)
 */
export const getAllStoresAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = {};
  if (status) query.storeStatus = status;
  if (search) {
    query.$or = [
      { "storeIdentity.name": { $regex: search, $options: "i" } },
      { "storeIdentity.slug": { $regex: search, $options: "i" } }
    ];
  }

  const [stores, total] = await Promise.all([
    Store.find(query)
      .populate("sellerId", "business.displayName status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Store.countDocuments(query)
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      stores,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }, "Stores retrieved successfully")
  );
});

/**
 * @desc    Suspend a store
 * @route   POST /api/v1/admin/stores/:storeId/suspend
 * @access  Private (SUPER_ADMIN)
 */
export const suspendStoreHandler = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const { reason } = req.body;
  const { ipAddress, userAgent } = getClientInfo(req);

  const store = await Store.findById(storeId);
  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  store.storeStatus = "SUSPENDED";
  await store.save();

  await createAuditLog({
    action: AUDIT_ACTION.STORE_SUSPEND,
    userId: req.user.id,
    targetType: "Store",
    targetId: storeId,
    details: { reason },
    ipAddress,
    userAgent,
    storeId
  });

  res
    .status(200)
    .json(new ApiResponse(200, store, "Store suspended successfully"));
});

/**
 * @desc    Activate a store
 * @route   POST /api/v1/admin/stores/:storeId/activate
 * @access  Private (SUPER_ADMIN)
 */
export const activateStoreHandler = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const { ipAddress, userAgent } = getClientInfo(req);

  const store = await Store.findById(storeId);
  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  store.storeStatus = "ACTIVE";
  await store.save();

  await createAuditLog({
    action: AUDIT_ACTION.STORE_ACTIVATE,
    userId: req.user.id,
    targetType: "Store",
    targetId: storeId,
    ipAddress,
    userAgent,
    storeId
  });

  res
    .status(200)
    .json(new ApiResponse(200, store, "Store activated successfully"));
});

export default {
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
  activateStoreHandler
};
